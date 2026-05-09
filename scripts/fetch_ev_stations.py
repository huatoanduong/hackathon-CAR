#!/usr/bin/env python3
"""Fetch EV charging station data from a public Google My Maps KML export."""

from __future__ import annotations

import json
import re
import sys
import urllib.request
import xml.etree.ElementTree as ET
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

MAP_ID = "1h-GUae7-bU6YfRmNcxkNnKHJBwZnXWE"
KML_URL = f"https://www.google.com/maps/d/kml?mid={MAP_ID}&forcekml=1"
NS = {"kml": "http://www.opengis.net/kml/2.2"}
DESCRIPTION_BREAK_RE = re.compile(r"<br\s*/?>", re.IGNORECASE)
TAG_RE = re.compile(r"<[^>]+>")


def fetch_kml(url: str) -> str:
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (compatible; hackathon-car/1.0)",
        },
    )
    with urllib.request.urlopen(request, timeout=60) as response:
        charset = response.headers.get_content_charset() or "utf-8"
        return response.read().decode(charset)


def parse_description(raw_description: str | None) -> str | None:
    if not raw_description:
        return None
    text = DESCRIPTION_BREAK_RE.sub("\n", raw_description)
    text = TAG_RE.sub("", text)
    return text.strip() or None


def parse_coordinates(coord_text: str | None) -> dict[str, float] | None:
    if not coord_text:
        return None
    parts = [part.strip() for part in coord_text.strip().split(",")]
    if len(parts) < 2:
        return None
    lng, lat = float(parts[0]), float(parts[1])
    coordinates = {"lat": lat, "lng": lng}
    if len(parts) > 2 and parts[2]:
        coordinates["alt"] = float(parts[2])
    return coordinates


def parse_extended_data(placemark: ET.Element) -> dict[str, str]:
    data = {}
    for data_node in placemark.findall("kml:ExtendedData/kml:Data", NS):
        key = data_node.get("name")
        value = data_node.findtext("kml:value", default="", namespaces=NS).strip()
        if key:
            data[key] = value
    return data


def build_station(placemark: ET.Element, layer_name: str | None, index: int) -> dict:
    extended_data = parse_extended_data(placemark)
    description_raw = placemark.findtext("kml:description", default=None, namespaces=NS)
    coordinates = parse_coordinates(
        placemark.findtext("kml:Point/kml:coordinates", default=None, namespaces=NS)
    )
    return {
        "source_index": index,
        "name": (placemark.findtext("kml:name", default="", namespaces=NS) or "").strip(),
        "layer": layer_name,
        "description_html": description_raw,
        "description_text": parse_description(description_raw),
        "extendedData": extended_data,
        "coordinates": coordinates,
    }


def collect_stations(root: ET.Element) -> list[dict]:
    stations: list[dict] = []
    index = 1

    for folder in root.findall(".//kml:Folder", NS):
        layer_name = folder.findtext("kml:name", default=None, namespaces=NS)
        for placemark in folder.findall("./kml:Placemark", NS):
            stations.append(build_station(placemark, layer_name, index))
            index += 1

    if stations:
        return stations

    for placemark in root.findall(".//kml:Placemark", NS):
        stations.append(build_station(placemark, None, index))
        index += 1
    return stations


def build_summary(stations: list[dict]) -> dict:
    missing_coordinates = sum(1 for station in stations if not station["coordinates"])
    name_counts = Counter(station["name"] for station in stations if station["name"])
    duplicate_names = sum(1 for count in name_counts.values() if count > 1)

    coord_counts = Counter(
        (
            station["coordinates"]["lat"],
            station["coordinates"]["lng"],
        )
        for station in stations
        if station["coordinates"]
    )
    duplicate_coordinate_pairs = sum(1 for count in coord_counts.values() if count > 1)

    layers = Counter(station["layer"] or "UNSPECIFIED" for station in stations)

    return {
        "station_count": len(stations),
        "missing_coordinates": missing_coordinates,
        "duplicate_name_count": duplicate_names,
        "duplicate_coordinate_pair_count": duplicate_coordinate_pairs,
        "layers": dict(layers),
    }


def main() -> int:
    output_path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("data/ev-stations.raw.json")
    output_path.parent.mkdir(parents=True, exist_ok=True)

    kml_text = fetch_kml(KML_URL)
    root = ET.fromstring(kml_text)
    stations = collect_stations(root)
    summary = build_summary(stations)

    payload = {
        "source": {
            "type": "google_my_maps_kml",
            "map_id": MAP_ID,
            "url": KML_URL,
            "fetched_at": datetime.now(timezone.utc).isoformat(),
        },
        "summary": summary,
        "stations": stations,
    }

    output_path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    print(f"Wrote {summary['station_count']} stations to {output_path}")
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
