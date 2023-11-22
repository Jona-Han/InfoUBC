
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
  const R = 6371e3;
  const lat1 = busLoop.lat * Math.PI/180;
  const lat2 = building.avgLat * Math.PI/180;

  const dLat = (busLoop.lat - building.avgLat) * Math.PI/180;
  const dLon = (busLoop.lon - building.avgLon) * Math.PI/180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + 
            Math.cos(lat1) * Math.cos(lat2) * 
            Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const d = R * c;

  return d
}