# hackathon-CAR-hackathon

## EV Station Dataset

Fetch the public Google My Maps station data and write a raw JSON snapshot:

```bash
python scripts/fetch_ev_stations.py
```

Default output:

```text
data/ev-stations.raw.json
```

The crawler uses the public KML export for this map:

```text
https://www.google.com/maps/d/kml?mid=1h-GUae7-bU6YfRmNcxkNnKHJBwZnXWE&forcekml=1
```
