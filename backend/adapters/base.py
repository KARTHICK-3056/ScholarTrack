import hashlib
import time
import logging
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
import httpx
from bs4 import BeautifulSoup

# Structured diagnostic logger
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s")
logger = logging.getLogger("ScholarTrackAdapter")

class ScrapeFailureException(Exception):
    """Raised when an adapter fails after exceeding retry ceiling."""
    pass

class BaseAdapter(ABC):
    def __init__(self, source_id: str, name: str, base_url: str):
        self.source_id = source_id
        self.name = name
        self.base_url = base_url
        self.timeout = 5.0  # Explicit 5.0s timeout per SRS
        self.retry_ceiling = 3  # Maximum 3 attempts with exponential backoff
        self.backoff_factor = 0.3  # Base backoff in seconds (0.3s, 0.6s, 1.2s)
        self.robots_compliant = True
        self.is_outage_simulated = False
        self.simulated_failure_reason = None
        self.fixture_mode = "standard"  # "standard", "revised", "unknown", "outage"

    def set_fixture_mode(self, mode: str):
        self.fixture_mode = mode

    def toggle_outage(self, simulate: bool, reason: str = "HTTP 503 Upstream Gateway Timeout"):
        self.is_outage_simulated = simulate
        self.simulated_failure_reason = reason if simulate else None

    def compute_hash(self, data: Dict[str, Any]) -> str:
        """Computes deterministic SHA-256 content hash across core fields."""
        serialized = (
            f"{data.get('title', '')}|"
            f"{data.get('provider', '')}|"
            f"{data.get('education_level', '')}|"
            f"{data.get('discipline', '')}|"
            f"{data.get('region', '')}|"
            f"{data.get('benefit_text', '')}|"
            f"{data.get('eligibility_excerpt', '')}|"
            f"{data.get('due_at') or 'NULL'}|"
            f"{data.get('timezone', 'UTC')}"
        )
        return hashlib.sha256(serialized.encode("utf-8")).hexdigest()

    def fetch_html(self, target_url: Optional[str] = None) -> str:
        """Fetches HTML with retry ceiling (3 attempts), exponential backoff, and 5s timeout."""
        if self.is_outage_simulated or self.fixture_mode == "outage":
            logger.error(f"[{self.source_id}] Simulated outage active: {self.simulated_failure_reason or 'HTTP 503'}")
            raise ScrapeFailureException(self.simulated_failure_reason or "Simulated 503 Service Unavailable")

        # In local test/fixture mode, read from fixtures
        fixture_html = self.get_fixture_content()
        if fixture_html is not None:
            logger.info(f"[{self.source_id}] Loaded local fixture in mode '{self.fixture_mode}'")
            return fixture_html

        url = target_url or self.base_url
        last_exception = None

        for attempt in range(1, self.retry_ceiling + 1):
            try:
                start_time = time.time()
                logger.info(f"[{self.source_id}] Scrape attempt {attempt}/{self.retry_ceiling} -> {url} (timeout={self.timeout}s)")
                
                with httpx.Client(timeout=self.timeout, follow_redirects=True) as client:
                    response = client.get(
                        url,
                        headers={"User-Agent": "ScholarTrack-Bot/1.0 (+https://scholartrack.org/bot; robots-compliant)"}
                    )
                    latency = round((time.time() - start_time) * 1000, 2)
                    
                    if response.status_code == 200:
                        logger.info(f"[{self.source_id}] Attempt {attempt} SUCCESS ({latency}ms, status=200)")
                        return response.text
                    elif response.status_code >= 500:
                        logger.warning(f"[{self.source_id}] Server error {response.status_code} on attempt {attempt}")
                        last_exception = ScrapeFailureException(f"HTTP {response.status_code} server error")
                    else:
                        raise ScrapeFailureException(f"Unexpected HTTP status {response.status_code}")

            except (httpx.TimeoutException, httpx.RequestError) as ex:
                latency = round((time.time() - start_time) * 1000, 2)
                last_exception = ex
                logger.warning(f"[{self.source_id}] Attempt {attempt} FAILED ({latency}ms): {type(ex).__name__} - {str(ex)}")

            if attempt < self.retry_ceiling:
                sleep_time = self.backoff_factor * (2 ** (attempt - 1))
                logger.info(f"[{self.source_id}] Exponential backoff sleeping for {sleep_time:.2f}s...")
                time.sleep(sleep_time)

        logger.error(f"[{self.source_id}] Scrape exceeded retry ceiling of {self.retry_ceiling} attempts")
        raise ScrapeFailureException(f"Retry ceiling exceeded: {str(last_exception)}")

    @abstractmethod
    def get_fixture_content(self) -> Optional[str]:
        pass

    @abstractmethod
    def parse_notices(self, html_text: str) -> List[Dict[str, Any]]:
        pass
