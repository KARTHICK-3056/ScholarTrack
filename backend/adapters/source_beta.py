import os
from typing import List, Dict, Any, Optional
from bs4 import BeautifulSoup
from .base import BaseAdapter, logger

FIXTURE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "fixtures")

class SourceBetaAdapter(BaseAdapter):
    def __init__(self):
        super().__init__(
            source_id="source_beta",
            name="Apex Councils & Foundations (CSIR, Reliance, Inlaks)",
            base_url="https://csirhrdg.res.in"
        )

    def get_fixture_content(self) -> Optional[str]:
        if self.fixture_mode == "outage":
            fixture_file = os.path.join(FIXTURE_DIR, "malformed_503.html")
        elif self.fixture_mode == "unknown":
            fixture_file = os.path.join(FIXTURE_DIR, "source_beta_unknown_deadline.html")
        else:
            fixture_file = os.path.join(FIXTURE_DIR, "source_beta_standard.html")

        if os.path.exists(fixture_file):
            with open(fixture_file, "r", encoding="utf-8") as f:
                return f.read()
        return None

    def parse_notices(self, html_text: str) -> List[Dict[str, Any]]:
        soup = BeautifulSoup(html_text, "html.parser")
        rows = soup.find_all("div", class_="grant-row")
        notices: List[Dict[str, Any]] = []

        for row in rows:
            notice_id = row.get("data-grant-slug") or ""
            category_elem = row.find(class_="category")
            notice_type = category_elem.get_text(strip=True) if category_elem else "Scholarship"
            if notice_type not in ["Scholarship", "Fellowship"]:
                notice_type = "Scholarship"

            title_elem = row.find(class_="grant-title")
            title = title_elem.get_text(strip=True) if title_elem else "Untitled Grant"

            sponsor_elem = row.find(class_="sponsor")
            provider = sponsor_elem.get_text(strip=True) if sponsor_elem else "Independent Foundation"

            degree_elem = row.find(class_="target-degree")
            education_level = degree_elem.get_text(strip=True) if degree_elem else "Postgraduate"

            disc_elem = row.find(class_="subject-area") or row.find(class_="discipline-tag")
            discipline = disc_elem.get_text(strip=True) if disc_elem else "Interdisciplinary"

            region_elem = row.find(class_="jurisdiction") or row.find(class_="region-tag")
            region = region_elem.get_text(strip=True) if region_elem else "Global"

            cov_elem = row.find(class_="coverage")
            benefit_text = cov_elem.get_text(strip=True) if cov_elem else "Funding support per foundation guidelines"

            req_elem = row.find(class_="requirements")
            eligibility_excerpt = req_elem.get_text(strip=True) if req_elem else "Refer to official foundation call."

            time_elem = row.find("time")
            due_at = None
            timezone = "UTC"
            if time_elem and time_elem.get("datetime"):
                raw_due = time_elem.get("datetime").strip()
                if raw_due:
                    due_at = raw_due
                timezone = time_elem.get("data-timezone") or "UTC"
            # Note: If time_elem is absent (like in unknown deadline fixtures), due_at remains None!

            url_elem = row.find("a", class_="official-link")
            url = url_elem.get("href") if url_elem else self.base_url

            parsed_data = {
                "notice_id": notice_id,
                "source_id": self.source_id,
                "url": url,
                "notice_type": notice_type,
                "title": title,
                "provider": provider,
                "education_level": education_level,
                "discipline": discipline,
                "region": region,
                "benefit_text": benefit_text,
                "eligibility_excerpt": eligibility_excerpt,
                "due_at": due_at,
                "timezone": timezone,
                "notice_status": "CONFIRMED",
            }
            parsed_data["content_hash"] = self.compute_hash(parsed_data)
            notices.append(parsed_data)

        logger.info(f"[{self.source_id}] Successfully parsed {len(notices)} grants from HTML.")
        return notices
