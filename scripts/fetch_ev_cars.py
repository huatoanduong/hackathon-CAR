#!/usr/bin/env python3
"""Write a curated Vietnam-market EV model dataset."""

from __future__ import annotations

import json
import sys
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

MODELS = [
    {
        "id": "byd-dolphin",
        "brand": "BYD",
        "model": "DOLPHIN",
        "variant": None,
        "market": "Vietnam",
        "bodyStyle": "Hatchback",
        "availabilityStatus": "official_vietnam_page",
        "officialRange": {
            "value": 435,
            "unit": "km",
            "kmEquivalent": 435,
            "testCycle": "NEDC",
        },
        "batteryCapacityKWh": None,
        "source": {
            "title": "BYD Dolphin 2026 leaflet",
            "url": "https://www.byd.com/material/byd-site/vn/product/new-byd-dolphin/1.%20Leaflet%20BYD%20Dolphin%202026_Low.pdf",
            "note": "Official Vietnam leaflet shows 435 km NEDC range.",
        },
    },
    {
        "id": "byd-atto-3",
        "brand": "BYD",
        "model": "ATTO 3",
        "variant": "Superior MY2023",
        "market": "Vietnam",
        "bodyStyle": "SUV",
        "availabilityStatus": "official_vietnam_page",
        "officialRange": {
            "value": 420,
            "unit": "km",
            "kmEquivalent": 420,
            "testCycle": "WLTP",
        },
        "batteryCapacityKWh": 60.48,
        "source": {
            "title": "BYD ATTO 3 leaflet",
            "url": "https://www.byd.com/content/dam/byd-site/vn/proudct-specs/Atto3-Leaflet.pdf",
            "note": "Official leaflet lists up to 420 km WLTP and 60.48 kWh for the extended-range version.",
        },
    },
    {
        "id": "byd-seal",
        "brand": "BYD",
        "model": "SEAL",
        "variant": "RWD",
        "market": "Vietnam",
        "bodyStyle": "Sedan",
        "availabilityStatus": "official_vietnam_page",
        "officialRange": {
            "value": 570,
            "unit": "km",
            "kmEquivalent": 570,
            "testCycle": "WLTP",
        },
        "batteryCapacityKWh": 82.5,
        "source": {
            "title": "BYD SEAL",
            "url": "https://www.byd.com/vn/car/seal",
            "note": "Vietnam model page confirms the model; BYD official spec sheet lists up to 570 km WLTP for the RWD version.",
        },
    },
    {
        "id": "byd-m6",
        "brand": "BYD",
        "model": "M6",
        "variant": None,
        "market": "Vietnam",
        "bodyStyle": "MPV",
        "availabilityStatus": "official_vietnam_page",
        "officialRange": {
            "value": None,
            "unit": "km",
            "kmEquivalent": None,
            "testCycle": "NEDC",
        },
        "batteryCapacityKWh": None,
        "source": {
            "title": "BYD Auto (Vietnam) | BYD M6",
            "url": "https://www.byd.com/vn/car/m6",
            "note": "Official Vietnam page confirms the M6 is sold in Vietnam, but the captured public page did not expose the numeric range value in the search result.",
        },
    },
    {
        "id": "ford-mustang-mach-e-premium-awd",
        "brand": "Ford",
        "model": "Mustang Mach-E",
        "variant": "Premium AWD",
        "market": "Vietnam",
        "bodyStyle": "SUV",
        "availabilityStatus": "official_vietnam_page",
        "officialRange": {
            "value": 550,
            "unit": "km",
            "kmEquivalent": 550,
            "testCycle": "unspecified",
        },
        "batteryCapacityKWh": None,
        "source": {
            "title": "Ford Mustang Mach-E Premium AWD | SUV Thuần Điện Hiệu Năng Cao",
            "url": "https://www.ford.com.vn/showroom/electric/ford-mustang-mach-e/models/premium-awd/",
            "note": "Ford Vietnam lists 550 km operating range on the product page.",
        },
    },
    {
        "id": "geely-ex2",
        "brand": "Geely",
        "model": "EX2",
        "variant": "Pro/Max",
        "market": "Vietnam",
        "bodyStyle": "SUV",
        "availabilityStatus": "official_vietnam_page",
        "officialRange": {
            "value": 395,
            "unit": "km",
            "kmEquivalent": 395,
            "testCycle": "NEDC",
        },
        "batteryCapacityKWh": 39.4,
        "source": {
            "title": "Geely EX2 (Pro/Max)",
            "url": "https://geely.vn/san-pham/geely-ex2/",
            "note": "Geely Vietnam lists 39.4 kWh battery and 395 km NEDC range.",
        },
    },
    {
        "id": "geely-ex5",
        "brand": "Geely",
        "model": "EX5",
        "variant": "Pro/Max",
        "market": "Vietnam",
        "bodyStyle": "SUV",
        "availabilityStatus": "official_vietnam_page",
        "officialRange": {
            "value": 495,
            "unit": "km",
            "kmEquivalent": 495,
            "testCycle": "NEDC",
        },
        "batteryCapacityKWh": 60.22,
        "source": {
            "title": "Geely EX5",
            "url": "https://geely.vn/san-pham/geely-ex5/",
            "note": "Geely Vietnam lists 60.22 kWh battery and 495 km NEDC range.",
        },
    },
    {
        "id": "hyundai-ioniq-5-exclusive",
        "brand": "Hyundai",
        "model": "IONIQ 5",
        "variant": "Exclusive",
        "market": "Vietnam",
        "bodyStyle": "SUV",
        "availabilityStatus": "official_vietnam_page",
        "officialRange": {
            "value": None,
            "unit": "km",
            "kmEquivalent": None,
            "testCycle": "unspecified",
        },
        "batteryCapacityKWh": 58.0,
        "source": {
            "title": "IONIQ 5",
            "url": "https://hyundai.thanhcong.vn/ioniq-5-2?attr=thong-so",
            "note": "Hyundai Thanh Cong's Vietnam page lists the Exclusive variant with a 58 kWh battery; the captured public page did not clearly expose range.",
        },
    },
    {
        "id": "hyundai-ioniq-5-prestige",
        "brand": "Hyundai",
        "model": "IONIQ 5",
        "variant": "Prestige",
        "market": "Vietnam",
        "bodyStyle": "SUV",
        "availabilityStatus": "official_vietnam_page",
        "officialRange": {
            "value": None,
            "unit": "km",
            "kmEquivalent": None,
            "testCycle": "unspecified",
        },
        "batteryCapacityKWh": 72.6,
        "source": {
            "title": "IONIQ 5",
            "url": "https://hyundai.thanhcong.vn/ioniq-5-2?attr=thong-so",
            "note": "Hyundai Thanh Cong's Vietnam page lists the Prestige variant with a 72.6 kWh battery; the captured public page did not clearly expose range.",
        },
    },
    {
        "id": "wuling-hongguang-mini-ev-lv1-120",
        "brand": "Wuling",
        "model": "HongGuang Mini EV",
        "variant": "LV1 - 120",
        "market": "Vietnam",
        "bodyStyle": "Mini car",
        "availabilityStatus": "official_vietnam_page",
        "officialRange": {
            "value": 120,
            "unit": "km",
            "kmEquivalent": 120,
            "testCycle": "unspecified",
        },
        "batteryCapacityKWh": 9.6,
        "source": {
            "title": "Wuling Mini EV brochure",
            "url": "https://wuling-ev.vn/san-pham/Brochure_Mini_EV.pdf",
            "note": "Official Wuling Vietnam brochure covers the 120 km and 170 km Mini EV variants.",
        },
    },
    {
        "id": "wuling-hongguang-mini-ev-lv1-170",
        "brand": "Wuling",
        "model": "HongGuang Mini EV",
        "variant": "LV1 - 170",
        "market": "Vietnam",
        "bodyStyle": "Mini car",
        "availabilityStatus": "official_vietnam_page",
        "officialRange": {
            "value": 170,
            "unit": "km",
            "kmEquivalent": 170,
            "testCycle": "unspecified",
        },
        "batteryCapacityKWh": 13.4,
        "source": {
            "title": "Mini EV LV1 - 170",
            "url": "https://wuling-ev.vn/en/product/lv1---170~p10",
            "note": "Official Wuling Vietnam page lists 170 km range and 13.4 kWh battery.",
        },
    },
    {
        "id": "wuling-hongguang-mini-ev-lv2-120",
        "brand": "Wuling",
        "model": "HongGuang Mini EV",
        "variant": "LV2 - 120",
        "market": "Vietnam",
        "bodyStyle": "Mini car",
        "availabilityStatus": "official_vietnam_page",
        "officialRange": {
            "value": 120,
            "unit": "km",
            "kmEquivalent": 120,
            "testCycle": "unspecified",
        },
        "batteryCapacityKWh": 9.6,
        "source": {
            "title": "Wuling Mini EV brochure",
            "url": "https://wuling-ev.vn/san-pham/Brochure_Mini_EV.pdf",
            "note": "Official Wuling Vietnam brochure covers the 120 km and 170 km Mini EV variants.",
        },
    },
    {
        "id": "wuling-hongguang-mini-ev-lv2-170",
        "brand": "Wuling",
        "model": "HongGuang Mini EV",
        "variant": "LV2 - 170",
        "market": "Vietnam",
        "bodyStyle": "Mini car",
        "availabilityStatus": "official_vietnam_page",
        "officialRange": {
            "value": 170,
            "unit": "km",
            "kmEquivalent": 170,
            "testCycle": "unspecified",
        },
        "batteryCapacityKWh": 13.4,
        "source": {
            "title": "Mini EV LV2 - 170",
            "url": "https://wuling-ev.vn/vi/miniev-lv2-170",
            "note": "Official Wuling Vietnam page lists 170 km range and 13.4 kWh battery.",
        },
    },
    {
        "id": "wuling-bingo-333",
        "brand": "Wuling",
        "model": "Bingo EV",
        "variant": "333 km",
        "market": "Vietnam",
        "bodyStyle": "Hatchback",
        "availabilityStatus": "official_vietnam_page",
        "officialRange": {
            "value": 333,
            "unit": "km",
            "kmEquivalent": 333,
            "testCycle": "unspecified",
        },
        "batteryCapacityKWh": None,
        "source": {
            "title": "Wuling Bingo EV",
            "url": "https://wuling-ev.vn/vi/wuling-bingo",
            "note": "Official Wuling Vietnam page points to the 333 km and 410 km Bingo variants.",
        },
    },
    {
        "id": "wuling-bingo-410",
        "brand": "Wuling",
        "model": "Bingo EV",
        "variant": "410 km",
        "market": "Vietnam",
        "bodyStyle": "Hatchback",
        "availabilityStatus": "official_vietnam_page",
        "officialRange": {
            "value": 410,
            "unit": "km",
            "kmEquivalent": 410,
            "testCycle": "unspecified",
        },
        "batteryCapacityKWh": None,
        "source": {
            "title": "Wuling Bingo EV",
            "url": "https://wuling-ev.vn/vi/wuling-bingo",
            "note": "Official Wuling Vietnam page points to the 333 km and 410 km Bingo variants.",
        },
    },
    {
        "id": "vinfast-vf-3",
        "brand": "VinFast",
        "model": "VF 3",
        "variant": None,
        "market": "Vietnam",
        "bodyStyle": "Mini SUV",
        "availabilityStatus": "official_vietnam_page",
        "officialRange": {
            "value": 215,
            "unit": "km",
            "kmEquivalent": 215,
            "testCycle": "NEDC",
        },
        "batteryCapacityKWh": 18.64,
        "source": {
            "title": "VinFast's Online EV reservation",
            "url": "https://shop.vinfastauto.com/vn_en/dat-coc-o-to-dien-vinfast.html",
            "note": "VinFast reservation page lists 18.64 kWh usable battery and 215 km range.",
        },
    },
    {
        "id": "vinfast-vf-5",
        "brand": "VinFast",
        "model": "VF 5",
        "variant": "Plus",
        "market": "Vietnam",
        "bodyStyle": "SUV",
        "availabilityStatus": "official_vietnam_page",
        "officialRange": {
            "value": 326,
            "unit": "km",
            "kmEquivalent": 326,
            "testCycle": "NEDC",
        },
        "batteryCapacityKWh": None,
        "source": {
            "title": "VinFast's Online EV reservation",
            "url": "https://shop.vinfastauto.com/vn_en/dat-coc-o-to-dien-vinfast.html",
            "note": "VinFast page lists VF 5 range up to 326 km NEDC.",
        },
    },
    {
        "id": "vinfast-vf-6",
        "brand": "VinFast",
        "model": "VF 6",
        "variant": "Plus",
        "market": "Vietnam",
        "bodyStyle": "SUV",
        "availabilityStatus": "official_vietnam_page",
        "officialRange": {
            "value": 399,
            "unit": "km",
            "kmEquivalent": 399,
            "testCycle": "WLTP",
        },
        "batteryCapacityKWh": None,
        "source": {
            "title": "VinFast's Online EV reservation",
            "url": "https://shop.vinfastauto.com/vn_en/dat-coc-o-to-dien-vinfast.html",
            "note": "VinFast page lists VF 6 range up to 399 km WLTP.",
        },
    },
    {
        "id": "vinfast-vf-7-eco",
        "brand": "VinFast",
        "model": "VF 7",
        "variant": "Eco",
        "market": "Vietnam",
        "bodyStyle": "SUV",
        "availabilityStatus": "official_vietnam_page",
        "officialRange": {
            "value": 375,
            "unit": "km",
            "kmEquivalent": 375,
            "testCycle": "unspecified",
        },
        "batteryCapacityKWh": None,
        "source": {
            "title": "VinFast's Online EV reservation",
            "url": "https://shop.vinfastauto.com/vn_en/dat-coc-o-to-dien-vinfast.html",
            "note": "VinFast page shows the VF 7 Eco with 375 km range.",
        },
    },
    {
        "id": "vinfast-vf-7-plus",
        "brand": "VinFast",
        "model": "VF 7",
        "variant": "Plus",
        "market": "Vietnam",
        "bodyStyle": "SUV",
        "availabilityStatus": "official_vietnam_page",
        "officialRange": {
            "value": 431,
            "unit": "km",
            "kmEquivalent": 431,
            "testCycle": "unspecified",
        },
        "batteryCapacityKWh": None,
        "source": {
            "title": "VinFast's Online EV reservation",
            "url": "https://shop.vinfastauto.com/vn_en/dat-coc-o-to-dien-vinfast.html",
            "note": "VinFast page shows the VF 7 Plus with 431 km range.",
        },
    },
    {
        "id": "vinfast-vf-8",
        "brand": "VinFast",
        "model": "VF 8",
        "variant": None,
        "market": "Vietnam",
        "bodyStyle": "SUV",
        "availabilityStatus": "official_vietnam_page",
        "officialRange": {
            "value": 471,
            "unit": "km",
            "kmEquivalent": 471,
            "testCycle": "unspecified",
        },
        "batteryCapacityKWh": None,
        "source": {
            "title": "VinFast's Online EV reservation",
            "url": "https://shop.vinfastauto.com/vn_en/dat-coc-o-to-dien-vinfast.html",
            "note": "VinFast page lists VF 8 range up to 471 km.",
        },
    },
    {
        "id": "vinfast-vf-9",
        "brand": "VinFast",
        "model": "VF 9",
        "variant": None,
        "market": "Vietnam",
        "bodyStyle": "SUV",
        "availabilityStatus": "official_vietnam_page",
        "officialRange": {
            "value": 626,
            "unit": "km",
            "kmEquivalent": 626,
            "testCycle": "unspecified",
        },
        "batteryCapacityKWh": None,
        "source": {
            "title": "VinFast's Online EV reservation",
            "url": "https://shop.vinfastauto.com/vn_en/dat-coc-o-to-dien-vinfast.html",
            "note": "VinFast page lists VF 9 range up to 626 km.",
        },
    },
]


def build_summary(models: list[dict]) -> dict:
    brands = Counter(model["brand"] for model in models)
    body_styles = Counter(model["bodyStyle"] for model in models)
    test_cycles = Counter(model["officialRange"]["testCycle"] for model in models)
    known_range_count = sum(1 for model in models if model["officialRange"]["kmEquivalent"] is not None)

    return {
        "model_count": len(models),
        "brand_count": len(brands),
        "known_range_count": known_range_count,
        "brands": dict(brands),
        "body_styles": dict(body_styles),
        "test_cycles": dict(test_cycles),
    }


def main() -> int:
    output_path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("data/ev-cars.raw.json")
    output_path.parent.mkdir(parents=True, exist_ok=True)

    payload = {
        "source": {
            "type": "curated_vietnam_market_ev_models",
            "country": "Vietnam",
            "fetched_at": datetime.now(timezone.utc).isoformat(),
            "notes": [
                "This snapshot focuses on EV models shown on official Vietnam brand pages or official Vietnam-market materials.",
                "Range figures are stored as published by the source; test cycles vary by brand and should not be compared directly.",
                "Some official Vietnam pages expose battery size and model availability but not a public numeric range in the captured page; those entries keep range as null.",
            ],
        },
        "summary": build_summary(MODELS),
        "models": MODELS,
    }

    output_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {len(MODELS)} Vietnam-market EV models to {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
