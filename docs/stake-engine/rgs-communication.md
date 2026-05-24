# Remote Game Server (RGS) Communication

Session authentication and bet transactions are handled exclusively through the Stake Engine RGS. The RGS manages session token generation, play/ responses, and optional parameters like supported currencies and languages.

## RGS Authentication

- **Bet Level Verification:** The authenticate HTTP response returns default bet levels, supported bet levels for a specified currency, and minimum/maximum bet amounts. The frontend must respect these values. Example: If the default bet size is 1 unit but the session uses JPY (minimum bet size: 10 units), the play/ request will fail.
- Bet increments must reflect allowed values within `authenticate/config/minStep`.
- Minimum and maximum bet levels must be available for selection as dictated by the RGS.

## Cross-Site-Scripting (XSS)

Stake Engine enforces a strict XSS policy. The game build must consist only of static files and cannot reach external sources. Common issues include downloading fonts from external servers, which logs console errors.

## RGS URL

The game must use the `rgs_url` query parameter to determine the server to call.

## Currency and Language

English is the only required language. If only English (en) is supported, on-screen text must not corrupt when other language parameters are passed.

### Supported Languages

| Language | Abbreviation |
|----------|-------------|
| Arabic | ar |
| German | de |
| English | en |
| Spanish | es |
| Finnish | fi |
| French | fr |
| Hindi | hi |
| Indonesian | id |
| Japanese | ja |
| Korean | ko |
| Polish | po |
| Portuguese | pt |
| Russian | ru |
| Turkish | tr |
| Chinese | zh |
| Vietnamese | vi |

### Supported Currencies

| Currency | Abbreviation | Display Example |
|----------|-------------|----------------|
| United States Dollar | USD | $10.00 |
| Canadian Dollar | CAD | CA$10.00 |
| Japanese Yen | JPY | ¥10 |
| Euro | EUR | €10.00 |
| Russian Ruble | RUB | ₽10.00 |
| Chinese Yuan | CNY | CN¥10.00 |
| Philippine Peso | PHP | ₱10.00 |
| Indian Rupee | INR | ₹10.00 |
| Indonesian Rupiah | IDR | Rp10 |
| South Korean Won | KRW | ₩10 |
| Brazilian Real | BRL | R$10.00 |
| Mexican Peso | MXN | MX$10.00 |
| Danish Krone | DKK | 10.00 KR |
| Polish Złoty | PLN | 10.00 zł |
| Vietnamese Đồng | VND | 10 ₫ |
| Turkish Lira | TRY | ₺10.00 |
| Chilean Peso | CLP | 10 CLP |
| Argentine Peso | ARS | 10.00 ARS |
| Peruvian Sol | PEN | S/10.00 |
| Nigerian Naira | NGN | ₦10.00 |
| Saudi Arabia Riyal | SAR | 10.00 SAR |
| Israel Shekel | ILS | 10.00 ILS |
| United Arab Emirates Dirham | AED | 10.00 AED |
| Taiwan New Dollar | TWD | NT$10.00 |
| Norway Krone | NOK | kr10.00 |
| Kuwaiti Dinar | KWD | KD10.00 |
| Jordanian Dinar | JOD | JD10.00 |
| Costa Rica Colon | CRC | ₡10.00 |
| Tunisian Dinar | TND | 10.00 TND |
| Singapore Dollar | SGD | SG$10.00 |
| Malaysia Ringgit | MYR | RM10.00 |
| Oman Rial | OMR | 10.00 OMR |
| Qatar Riyal | QAR | 10.00 QAR |
| Bahraini Dinar | BHD | BD10.00 |
| Stake Gold Coin | XGC | 10.00 GC |
| Stake Cash | XSC | 10.00 SC |

Find code examples for displaying these values at https://stake-engine.com/docs/rgs
