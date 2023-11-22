
const busLoop = {lat: 49.2675373, lon: -123.2474431}

export function distanceQuery(dist: number) {
  const query = {
    "WHERE": {
      "AND": [
        {
          "GT": {
            "rooms_lat": busLoop.lat - dist
          }
        },
        {
          "LT": {
            "rooms_lat": busLoop.lat + dist
          }
        },
        {
          "LT": {
            "rooms_lon": busLoop.lon + dist
          }
        },
        {
          "GT": {
            "rooms_lon": busLoop.lon - dist
          }
        }
       ]
    },
       "OPTIONS": {
      "COLUMNS": [
        "rooms_fullname",
        "rooms_shortname",
        "rooms_address",
        "avgLat",
        "avgLon"
      ]
    },
      "TRANSFORMATIONS": {
        "GROUP": [
          "rooms_fullname",
          "rooms_shortname",
          "rooms_address"
        ],
        "APPLY": [{
          "avgLat": {
              "AVG": "rooms_lat"
          }
        },
      {
        "avgLon": {
          "AVG": "rooms_lon"
        }
      }]
      }
  }
  return query
}

export function filterQueryResult(dist: number, result: any[]): any[] {
  const filtered: any[] = [];
  for (const building of result) {
    if (distanceFromBusLoop(building) <= dist) {
      console.log(building)
      filtered.push({
        fullname: building.rooms_fullname,
        shortname: building.rooms_shortname,
        address: building.rooms_shortname
      })
    }
  }
  return filtered
}

function distanceFromBusLoop(building: any): number {
  const dLat = busLoop.lat - building.avgLat;
  const dLon = busLoop.lon - building.avgLon;
  const a = Math.pow(Math.sin(dLat / 2), 2) + Math.cos(busLoop.lat)*Math.cos(building.avgLat)*Math.pow(Math.sin(dLon/2), 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const dist = 6371*c
  return dist
}