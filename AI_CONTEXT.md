# AI Context & Implementation Plan

## Mục tiêu Dự án (Project Goal)
Dự án `datcom-clone` là một ứng dụng NestJS (phiên bản 11+) standalone. Ứng dụng này sử dụng chung thư viện `Nezon` (Mezon Bot wrapper) với dự án gốc `QnOffice`. 
Nhiệm vụ chính: Bot sẽ lắng nghe tin nhắn từ luồng nguồn (`qn-datcom`) và tự động chuyển tiếp nội dung đến luồng đích do user config.

## ⚠️ QUY TẮC BẮT BUỘC — Nezon-First

> [!CAUTION]
> **KHÔNG BAO GIỜ gọi trực tiếp `mezon-sdk` API (MezonApi, apiClient, protobuf, rateLimitFetch, v.v.).**
> Mọi tương tác với Mezon **PHẢI** thông qua thư viện `Nezon` (`src/libs/nezon`).
>
> Nếu một API trong `mezon-sdk` cần dùng nhưng `Nezon` chưa wrap → **cập nhật code Nezon trước**, thêm abstraction/wrapper vào Nezon, rồi mới gọi từ handler/service.

### Patterns đúng (tham khảo QnOffice)
| Hành động | Cách làm đúng |
|---|---|
| **Inject bot client** | `constructor(private readonly mezonClient: MezonClient)` — `NezonModule` đã register provider |
| **Gửi tin nhắn** | `const channel = await mezonClient.channels.fetch(id)` → `channel.send(content, mentions, attachments)` |
| **Nhận tin nhắn** | `@On(Events.ChannelMessage)` + `@AutoContext() [managedMessage]: Nezon.AutoContext` |
| **Gửi DM** | `const user = await mezonClient.users.fetch(userId)` → `user.sendDM(content)` |
| **Tạo tin nhắn** | Dùng `SmartMessage.text(...)`, `SmartMessage.build()`, `EmbedBuilder`, `ButtonBuilder` |
| **Fetch message entity** | `channel.messages.fetch(messageId)` (chỉ hoạt động với tin bot đã thấy qua WebSocket) |

### Lưu ý kỹ thuật
- **SDK không có API fetch lịch sử tin nhắn.** `channel.messages` chỉ là cache. Để test bot phải gửi tin thật.
- Nếu cần API mới (ví dụ: fetch history, pin message, v.v.) → thêm method vào `NezonClientService` hoặc `NezonUtilsService`, wrap qua `MezonClient` internal.

## Tech Stack
- **Framework:** NestJS 11+
- **Bot Wrapper:** `src/libs/nezon` (copy từ QnOffice, path alias `@nezon`)
- **SDK:** `mezon-sdk@latest`
- **ORM:** Prisma
- **DB:** PostgreSQL (`datcom_dev`, user `dev`, pass `password`)

## Trạng thái Hiện tại
- [x] Scaffolding NestJS + dependencies + Prisma init
- [x] Copy Nezon library + tsconfig alias (`@nezon`, `@nezon/*`, `@src/*`)
- [x] BotModule + NezonModule config (dùng `MEZON_BOT_TOKEN`, `MEZON_BOT_ID`)
- [x] Bot connected thành công (`🤖 Mezon Client is ready!`)
- [x] Channel `qn-datcom` fetched thành công (name: qn-datcom, Clan: 1779484504377790464)
- [ ] **CẦN SỬA:** `bot.module.ts` đang có raw API code → xóa, giữ chỉ ready log
- [ ] **CẦN SỬA:** `forwarding.handler.ts` đang dùng `NezonClientService` → sửa sang inject `MezonClient` trực tiếp
- [ ] Test thực tế: gửi tin vào channel datcom, xác nhận bot forward

## Cấu hình `.env`
```
DATABASE_URL="postgresql://dev:password@localhost:5432/datcom_dev?schema=public"
MEZON_BOT_ID=1948621256983056384
MEZON_BOT_TOKEN=RNsIxhjxK-isTJcw
SOURCE_THREAD_ID=1841290471456903168
DESTINATION_THREAD_ID=mock_dest_thread_id
```

## Cấu trúc thư mục chính
```
src/
├── app.module.ts          # Root module (imports ConfigModule, BotModule)
├── bot/
│   ├── bot.module.ts      # Imports NezonModule, registers handlers
│   └── handler/
│       └── forwarding.handler.ts  # @On(Events.ChannelMessage) listener
├── libs/
│   └── nezon/             # Mezon Bot wrapper library (copy từ QnOffice)
└── prisma/
    └── schema.prisma
```
