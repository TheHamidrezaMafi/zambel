# alibaba configs
class AlibabaConfig:
    provider_name = "alibaba"
    yata_code_postfix = "ALL"
    domestic_dict_name = "departing"
    foreign_dict_name = "proposals"

    alibaba_domestic_api = "https://ws.alibaba.ir/api/v1/flights/domestic/available/"
    alibaba_international_api = "https://ws.alibaba.ir/api/v1/flights/international/proposal-requests/"
    get_api_header = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:138.0) "
        "Gecko/20100101 Firefox/138.0"
    ),
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.5",
    "Accept-Encoding": "gzip, deflate, br, zstd",
    "Referer": "https://www.alibaba.ir/",
    "ab-channel": "WEB-NEW,PRODUCTION,CSR,www.alibaba.ir,desktop,Firefox,138.0,N,N,Mac OS,10.15,3.164.1",
    "tracing-sessionid": "1747498979606",
    "ab-alohomora": "rzmrKW9bcQQ5EL51hYnSnv",
    "tracing-device": "N,Firefox,138.0,N,N,Mac OS",
    "Origin": "https://www.alibaba.ir",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-site",
    "Authorization": (
        "Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IkE2MDk5NjE0MUU5MTJDMDhBRjQyMEFG"
        "MjUyNjI2N0Q5NkNGRjUyRjZSUzI1NiIsInR5cCI6ImF0K2p3dCIsIng1dCI6InBnbV"
        "dGQjZSTEFpdlFncnlVbUpuMld6X1V2WSJ9."
        "eyJuYmYiOjE3NDc0OTEzMzksImV4cCI6MTc0NzU3NzczOSwiaXNzIjoiaHR0cDovL2l"
        "kZW50aXR5IiwiYXVkIjoiYXBpMSIsImNsaWVudF9pZCI6InJlLmNsaWVudCIsInN1Y"
        "iI6IjNkMDNhNmUxLTBjMDItNDI4ZC1hN2MwLThhY2M5ZDdjNTQ2OCIsImF1dGhfdGlt"
        "ZSI6MTc0NDM3ODI2OCwiaWRwIjoibG9jYWwiLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJ"
        "tYWhkaS5zaGVtc2hhZGlAZ21haWwuY29tIiwiZW1haWwiOiJtYWhkaS5zaGVtc2hhZ"
        "GlAZ21haWwuY29tIiwicGhvbmVfbnVtYmVyIjoiMDkxNjQ5NTYyMjQiLCJwaG9uZV9u"
        "dW1iZXJfdmVyaWZpZWQiOnRydWUsImlzX3Jlc2VsbGVyIjpmYWxzZSwic2FsZXNfY2"
        "hhbm5lbCI6IkIyQyIsImxlZ2FsX3JvbGVfaXNBZG1pbiI6ImZhbHNlIiwidXNlcl91b"
        "mlxdWVfbnVtYmVyIjoiOTgwNTM1IiwianRpIjoiMkM1NTUxNzVGNDFDREZGQTM2MzA0"
        "OEJCNTFEMUE3QTMiLCJpYXQiOjE3NDc0OTEzMzksInNjb3BlIjpbImFwaTEiLCJvZmZ"
        "saW5lX2FjY2VzcyJdLCJhbXIiOlsib3RwIl19."
        "HfjiN-M8B7MKeF0QQ8_KtMoOMzoDD_nFKDySU-KoH_BXPGxTk0Ng9s1ZTsvy2KrCo50"
        "TYq9Jnh1Si8XAPuZXFTClaCgcf5hYzi-x_Jg5hGrIZa06j8MwfXsztiOMsRhIyfsiZD"
        "EKw-yseErF7qziWR0PwUIka4tM410vYPRzwT97fRRKPZ-6IaDxhZCTdDK_nZY7wjrf8"
        "RCnd65cW9pCX3zbbqEpPfJAETKr41hR4i0kXg9cw5LBBqJO7mvlLUBBCoy24btLW9NY"
        "83x3d1r-wkS377px6ph5q38oweLbVstjQFYFB5Jvavjsj0K0d6WKJSSMJVstn0qTbHn"
        "PiczCMA"
    ),
    "Connection": "keep-alive",
    }

# safarmarket config
class SafarMarketConfig:
    safarmarket_api = "https://safarmarket.com/api/flight/v3/search"

# mrbilit config
class MrBilitConfig:
    mrbilit_api = "https://flight.atighgasht.com/api/Flights"

# pateh config
class PatehConfig:
    pateh_api = "https://api.pateh.com/gateway/api/bridge/flight/search-foreign"

# flytoday config
class FlyTodayConfig:
    flytoday_api = "https://api.flytoday.ir/api/V1/flight/search"

# safar366 config
class Safar366Config:
    safar366_api = "https://171.22.24.69/api/v1.0/flights/search"
    safar366_refresh_token_api = "https://171.22.24.69/api/v1.0/refreshtoken"
