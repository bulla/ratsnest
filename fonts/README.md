# Fonts

Every page ratsnest makes is set in Nunito 3.602, by the Nunito Project Authors, and carries it
(ADR 0012). Nunito is under the SIL Open Font License 1.1, in [`OFL.txt`](OFL.txt),
which goes wherever these files go.

| File                    | What it holds                                                  |
| ----------------------- | -------------------------------------------------------------- |
| `nunito-latin.woff2`    | Basic Latin, Latin-1, `Œ œ ‘ ’ “ ” … – − Ω` and the thin space |
| `nunito-cyrillic.woff2` | The Cyrillic letters, U+0400 to U+045F                         |

Both are variable, with every weight from 200 to 1000, and were cut by Google Fonts' subsetter from
these addresses, by `bun run fonts` (`scripts/fonts.ts`), which holds the characters:

- `nunito-latin.woff2`: <https://fonts.googleapis.com/css2?family=Nunito%3Awght%40200..1000&text=+%21%22%23%24%25%26%27%28%29*%2B%2C-.%2F0123456789%3A%3B%3C%3D%3E%3F%40ABCDEFGHIJKLMNOPQRSTUVWXYZ%5B%5C%5D%5E_%60abcdefghijklmnopqrstuvwxyz%7B%7C%7D%7E%C2%A0%C2%A1%C2%A2%C2%A3%C2%A4%C2%A5%C2%A6%C2%A7%C2%A8%C2%A9%C2%AA%C2%AB%C2%AC%C2%AD%C2%AE%C2%AF%C2%B0%C2%B1%C2%B2%C2%B3%C2%B4%C2%B5%C2%B6%C2%B7%C2%B8%C2%B9%C2%BA%C2%BB%C2%BC%C2%BD%C2%BE%C2%BF%C3%80%C3%81%C3%82%C3%83%C3%84%C3%85%C3%86%C3%87%C3%88%C3%89%C3%8A%C3%8B%C3%8C%C3%8D%C3%8E%C3%8F%C3%90%C3%91%C3%92%C3%93%C3%94%C3%95%C3%96%C3%97%C3%98%C3%99%C3%9A%C3%9B%C3%9C%C3%9D%C3%9E%C3%9F%C3%A0%C3%A1%C3%A2%C3%A3%C3%A4%C3%A5%C3%A6%C3%A7%C3%A8%C3%A9%C3%AA%C3%AB%C3%AC%C3%AD%C3%AE%C3%AF%C3%B0%C3%B1%C3%B2%C3%B3%C3%B4%C3%B5%C3%B6%C3%B7%C3%B8%C3%B9%C3%BA%C3%BB%C3%BC%C3%BD%C3%BE%C3%BF%C5%92%C5%93%E2%80%98%E2%80%99%E2%80%9C%E2%80%9D%E2%80%A6%E2%80%93%E2%88%92%CE%A9%E2%80%89>
- `nunito-cyrillic.woff2`: <https://fonts.googleapis.com/css2?family=Nunito%3Awght%40200..1000&text=%D0%80%D0%81%D0%82%D0%83%D0%84%D0%85%D0%86%D0%87%D0%88%D0%89%D0%8A%D0%8B%D0%8C%D0%8D%D0%8E%D0%8F%D0%90%D0%91%D0%92%D0%93%D0%94%D0%95%D0%96%D0%97%D0%98%D0%99%D0%9A%D0%9B%D0%9C%D0%9D%D0%9E%D0%9F%D0%A0%D0%A1%D0%A2%D0%A3%D0%A4%D0%A5%D0%A6%D0%A7%D0%A8%D0%A9%D0%AA%D0%AB%D0%AC%D0%AD%D0%AE%D0%AF%D0%B0%D0%B1%D0%B2%D0%B3%D0%B4%D0%B5%D0%B6%D0%B7%D0%B8%D0%B9%D0%BA%D0%BB%D0%BC%D0%BD%D0%BE%D0%BF%D1%80%D1%81%D1%82%D1%83%D1%84%D1%85%D1%86%D1%87%D1%88%D1%89%D1%8A%D1%8B%D1%8C%D1%8D%D1%8E%D1%8F%D1%90%D1%91%D1%92%D1%93%D1%94%D1%95%D1%96%D1%97%D1%98%D1%99%D1%9A%D1%9B%D1%9C%D1%9D%D1%9E%D1%9F>

Adding a character means adding it to `scripts/fonts.ts` and running it again. A test fails on any
character a page writes that these files lack.
