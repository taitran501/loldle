# Deep research: có emoji render nào là scythe không?

Ngày kiểm tra: 2026-09-11.

## Kết luận ngắn

**Không tìm thấy một emoji data/render set chuẩn nào có glyph scythe thật.**

Kết luận này áp dụng cho Unicode Emoji 17.0 và các bộ render phổ biến đã kiểm tra: Emoji Mart/Apple, Twemoji, Noto Emoji, Microsoft Fluent Emoji và OpenMoji standard. Vì vậy:

- `🗡️` là **dagger**, không phải scythe.
- `🪓` là **axe**, không phải scythe.
- `⚔️` là **crossed swords**, cũng không phải scythe.
- Đổi Apple sang Twemoji/Noto/Fluent/OpenMoji không thể biến `🗡️` thành scythe; renderer chỉ thay hình của cùng một code point.

Có hình scythe thật ở các kho **icon custom** như Game Icons, nhưng đó là SVG/PNG riêng, không phải emoji data. Đưa nó vào mode này sẽ chuyển contract từ “pure Unicode emoji” sang “emoji + custom icon”.

## Đã kiểm tra những nguồn nào?

| Nguồn | Có scythe glyph thật không? | Kết quả |
|---|---:|---|
| Unicode Emoji 17.0 | Không | `emoji-test.txt` có axe, dagger, crossed swords; không có `scythe` hay `sickle`. |
| `@emoji-mart/data` 15 / Apple | Không | Package dùng emoji data và Apple spritesheet; không có record/name/keyword scythe hoặc sickle. |
| Twemoji 17 | Không | Chính project mô tả là renderer cho standard Unicode emoji và không hỗ trợ custom emoji. |
| Google Noto Emoji | Không | Repo mô tả là thư viện standard Unicode emoji; không có scythe asset trong cây repo đã quét. |
| Microsoft Fluent Emoji | Không | Cây asset hiện tại có `Axe`, không có `Scythe`/`Sickle`. |
| OpenMoji | Không, trong set hiện tại | Có cơ chế dành cho non-standard/Private Use Area, nhưng `extras-openmoji.csv` hiện không có scythe/sickle. |
| Game Icons | **Có** | Có icon scythe SVG/PNG thật, nhưng là generic icon ngoài emoji standard; asset của Lorc, license CC BY 3.0. |
| Discord/custom emoji libraries | Có thể có | Có các PNG do người dùng upload, nhưng không phải một emoji data set chuẩn hoặc nguồn render ổn định để dùng làm contract. |

## Bằng chứng Unicode

File chính thức [Unicode Emoji 17.0 `emoji-test.txt`](https://unicode.org/Public/emoji/latest/emoji-test.txt) ghi rõ version 17.0 và dùng để kiểm tra các emoji được keyboard/display hỗ trợ. Trong subgroup `tool`, các entry liên quan là:

```text
🪓  axe
🗡️ dagger
⚔️ crossed swords
```

Tìm trực tiếp trong cùng file:

- `scythe`: không có kết quả.
- `sickle`: không có kết quả.

Đây là chỗ quyết định: hiện không có code point emoji độc lập để renderer phổ biến có thể render thành scythe.

Unicode có một số symbol dễ gây hiểu nhầm:

- `☭` là **Hammer And Sickle**, một symbol chính trị, không phải standalone scythe emoji. [Unicode NamesList](https://www.unicode.org/charts/nameslist/n_2600.html)
- `⚳` là **Ceres**, một astrological symbol có hình thức gợi scythe. Unicode xếp nó trong astrological symbols, không phải Emoji standard. [Unicode NamesList](https://www.unicode.org/charts/nameslist/n_2600.html)
- Một số trang “scythe emojis” chỉ gom `🪓`, `⚔️`, `☭`, hieroglyph hoặc symbol theo chủ đề. Đó là danh sách liên tưởng/copy-paste, không chứng minh có một rendered scythe emoji.

Trang [Unicode Emoji Proposals Status](https://unicode.org/emoji/emoji-proposals-status.html) là nơi Unicode công bố các proposal đã submit và trạng thái của chúng. Sau khi kiểm tra status/proposal references, không tìm thấy một scythe emoji đã được encoded/released; do đó không nên xem một proposal hoặc một symbol Unicode khác như asset hiện có.

## Bằng chứng từ các renderer

### Emoji Mart / Apple — nguồn đang dùng trong app

Package upstream [`@emoji-mart/data`](https://github.com/missive/emoji-mart/blob/main/packages/emoji-mart-data/package.json) hiện dùng set 15 và phụ thuộc vào `emoji-datasource` 15.0.1 cho dữ liệu Apple.

Kiểm tra local trong `node_modules/@emoji-mart/data/sets`:

- Quét toàn bộ các version/set JSON đang cài: **0** text hit cho `scythe|sickle`.
- Quét 168 emoji source unique trong `scripts/emoji-clues.json`: **168/168 có Apple render asset**, 0 missing.
- Điều này xác nhận renderer không bị thiếu hình cho catalog hiện tại; nó **không** xác nhận mọi clue đều đúng ngữ nghĩa.
- `🗡️` được map đúng vào record `dagger_knife`. Không có record scythe để map vào.

### Twemoji

README chính thức của [Twemoji](https://github.com/jdecked/twemoji) nói rõ project cung cấp standard Unicode emoji support, bám Emoji 17.0 và không hỗ trợ custom emoji. Vì Unicode không có scythe, Twemoji không thể cung cấp scythe glyph chuẩn.

### Noto Emoji

[Noto Emoji](https://github.com/googlefonts/noto-emoji) mô tả chính nó là thư viện hỗ trợ standard Unicode emoji, kèm font/vector/PNG assets. Nó có thể đổi style render, nhưng không mở rộng semantic inventory để thêm scythe.

### Microsoft Fluent Emoji

[Fluent Emoji](https://github.com/microsoft/fluentui-emoji) là bộ emoji render của Microsoft. Quét cây asset hiện tại cho thấy có `Axe` nhưng không có đường dẫn `Scythe` hoặc `Sickle`; đổi sang Fluent cũng không giải quyết được Kayn.

### OpenMoji

[OpenMoji](https://github.com/hfg-gmuend/openmoji) cung cấp SVG/PNG/font và có thể render standard emoji. Tài liệu [contributing](https://github.com/hfg-gmuend/openmoji/blob/master/CONTRIBUTING.md) xác nhận project có thể nhận non-standard emoji vào `extras-openmoji`/Private Use Area.

Nhưng kiểm tra dữ liệu hiện tại cho thấy:

- `extras-openmoji.csv`: không có `scythe|sickle`.
- `extras-unicode.csv`: không có `scythe|sickle`.
- `openmoji.csv`: hai hit chữ `sickle`, nhưng đều là keyword gắn với crescent moon; **không phải hình sickle/scythe**.

Đây là false lead quan trọng: keyword metadata không đồng nghĩa với việc source có glyph vũ khí tương ứng.

## Asset scythe thật có tồn tại không?

**Có, nhưng ngoài hệ emoji.**

[Game Icons — Scythe](https://game-icons.net/1x1/lorc/scythe.html) có icon scythe thật, tải được SVG/PNG, do Lorc và license CC BY 3.0. Đây là ứng viên hợp lệ nếu sản phẩm cho phép custom visual asset.

Tuy nhiên nó không đáp ứng các điều kiện sau:

- không có Unicode code point scythe;
- không có Apple/Twemoji/Noto/Fluent emoji record tương ứng;
- không cùng style/contract với Apple emoji spritesheet hiện tại;
- cần xử lý attribution/license nếu ship vào app.

Các kho custom emoji như [emoji.gg](https://emoji.gg/emoji/3020_scythe) cũng có PNG scythe, nhưng đó là user-uploaded custom emoji. Nó phù hợp để tham khảo khả năng tồn tại của hình ảnh, không phù hợp làm nguồn dữ liệu chuẩn cho puzzle.

## Implication cho Kayn

Source hiện tại có:

```text
Kayn = 🌑 🗡️ 👤 🔵 🔴
```

`🗡️` trong source chỉ nói “dagger” theo dữ liệu Unicode/render; nó không thể được diễn giải thành scythe của Kayn. Nếu giữ clue này và cho Kayn playable, người chơi không có cơ sở để nhận biết vũ khí đặc trưng của Kayn. Đó là vấn đề dữ liệu clue, không phải vấn đề CSS/rendering.

Quyết định đúng cho pure emoji mode:

1. **Không map `🗡️` thành scythe.**
2. **Không thay bằng `🪓`**, vì đó là axe và vẫn sai vật thể.
3. Kayn nên giữ trạng thái `needs_custom_asset`/review hold và không vào pool pure emoji hiện tại.
4. Chỉ đưa Kayn vào lại khi chọn một trong hai contract rõ ràng:
   - có custom scythe asset và chấp nhận hybrid mode;
   - hoặc thiết kế lại toàn bộ clue set theo hướng không dựa vào vũ khí — nhưng khi đó phải thừa nhận puzzle không còn dùng scythe để nhận diện Kayn.

## Kết luận để hành động

Nếu câu hỏi là **“có emoji data nào render được scythe để dùng ngay không?”**: **Không.**

Nếu câu hỏi là **“có hình scythe render được không?”**: **Có**, bằng SVG/PNG custom như Game Icons, nhưng đó không còn là pure emoji. Vì user requirement hiện tại là pure emoji, giữ Kayn ngoài pool là kết quả trung thực nhất; không có renderer switch nào giải quyết được thiếu hụt semantic asset này.

## Sources

1. [Unicode Emoji 17.0 emoji-test.txt](https://unicode.org/Public/emoji/latest/emoji-test.txt)
2. [Unicode NamesList — Miscellaneous Symbols](https://www.unicode.org/charts/nameslist/n_2600.html)
3. [Unicode Emoji Proposals Status](https://unicode.org/emoji/emoji-proposals-status.html)
4. [Emoji Mart data package](https://github.com/missive/emoji-mart/blob/main/packages/emoji-mart-data/package.json)
5. [Twemoji](https://github.com/jdecked/twemoji)
6. [Noto Emoji](https://github.com/googlefonts/noto-emoji)
7. [Microsoft Fluent Emoji](https://github.com/microsoft/fluentui-emoji)
8. [OpenMoji](https://github.com/hfg-gmuend/openmoji)
9. [OpenMoji contributing / non-standard emoji](https://github.com/hfg-gmuend/openmoji/blob/master/CONTRIBUTING.md)
10. [Game Icons — Scythe](https://game-icons.net/1x1/lorc/scythe.html)
11. [emoji.gg — custom scythe emoji example](https://emoji.gg/emoji/3020_scythe)
