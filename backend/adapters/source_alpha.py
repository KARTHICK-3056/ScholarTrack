import os
from typing import List, Dict, Any, Optional
from bs4 import BeautifulSoup
from .base import BaseAdapter, logger

FIXTURE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "fixtures")

class SourceAlphaAdapter(BaseAdapter):
    def __init__(self):
        super().__init__(
            source_id="source_alpha",
            name="National Scholarship Portal & Central Ministries (NSP / MoE)",
            base_url="https://scholarships.gov.in"
        )

    def get_fixture_content(self) -> Optional[str]:
        if self.fixture_mode == "outage":
            fixture_file = os.path.join(FIXTURE_DIR, "malformed_503.html")
        elif self.fixture_mode == "revised":
            fixture_file = os.path.join(FIXTURE_DIR, "source_alpha_revised.html")
        else:
            fixture_file = os.path.join(FIXTURE_DIR, "source_alpha_standard.html")

        if os.path.exists(fixture_file):
            with open(fixture_file, "r", encoding="utf-8") as f:
                return f.read()
        return None

    def parse_notices(self, html_text: str) -> List[Dict[str, Any]]:
        soup = BeautifulSoup(html_text, "html.parser")
        articles = soup.find_all("article", class_="notice-item")
        notices: List[Dict[str, Any]] = []

        for art in articles:
            notice_id = art.get("data-id") or ""
            notice_type_elem = art.find(class_="notice-type")
            notice_type = notice_type_elem.get_text(strip=True) if notice_type_elem else "Scholarship"
            if notice_type not in ["Scholarship", "Fellowship"]:
                notice_type = "Scholarship"

            title_elem = art.find(class_="title")
            title = title_elem.get_text(strip=True) if title_elem else "Untitled Notice"

            provider_elem = art.find(class_="provider")
            provider = provider_elem.get_text(strip=True) if provider_elem else "Unknown Provider"

            edu_elem = art.find(class_="education-level")
            education_level = edu_elem.get_text(strip=True) if edu_elem else "Undergraduate / Master's"

            disc_elem = art.find(class_="discipline")
            discipline = disc_elem.get_text(strip=True) if disc_elem else "All Disciplines"

            reg_elem = art.find(class_="region")
            region = reg_elem.get_text(strip=True) if reg_elem else "Global"

            benefit_elem = art.find(class_="benefit")
            benefit_text = benefit_elem.get_text(strip=True) if benefit_elem else "Full/Partial Tuition Grant"

            elig_elem = art.find(class_="eligibility")
            eligibility_excerpt = elig_elem.get_text(strip=True) if elig_elem else "Contact academic host for full requirements."

            deadline_elem = art.find(class_="deadline")
            due_at = None
            timezone = "UTC"
            if deadline_elem:
                due_at = deadline_elem.get("data-iso") or None
                timezone = deadline_elem.get("data-tz") or "UTC"

            status_tag = art.find(class_="status-tag")
            notice_status = "REVISED" if status_tag else "CONFIRMED"

            url_elem = art.find(class_="source-url")
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
                "notice_status": notice_status,
            }
            parsed_data["content_hash"] = self.compute_hash(parsed_data)
            notices.append(parsed_data)

        logger.info(f"[{self.source_id}] Successfully parsed {len(notices)} notices from HTML.")
        return notices
