# DropSidian

> **Dropbox + Obsidian** — Access your Obsidian vault from anywhere, no sync required.

## What is DropSidian?

DropSidian is a **web-based Obsidian client** that connects directly to your Dropbox-stored vault. It's a lightweight, frontend-only application hosted on GitHub Pages — no servers, no backend, just your browser and your notes.

## The Problem

You love Obsidian. Your vault lives in Dropbox for backup and sync. But what happens when:

- 📱 You're on a device without Obsidian installed?
- 💻 You're using a work computer where you can't install apps?
- 💡 You have a quick idea and need to capture it *now*?

You end up emailing yourself, using a random notes app, or just... forgetting.

## The Solution

DropSidian gives you **instant access to your Obsidian vault** from any browser:

- ✅ **Read your notes** — Browse and view your markdown files with proper rendering
- ✅ **Quick capture** — Create new notes directly into your Inbox folder
- ✅ **Edit on the go** — Make changes that sync back to your vault
- ✅ **Attach files** — Add images and PDFs to your notes
- ✅ **Obsidian-compatible** — Wikilinks (`[[Note]]`) and embeds (`![[image.png]]`) work as expected

## Key Features

| Feature | Description |
|---------|-------------|
| 🔐 **Secure Auth** | OAuth 2.0 with PKCE — no passwords stored, no backend needed |
| 💾 **Remember Me** | Stay logged in across sessions |
| 📂 **Your Vault** | Select any Dropbox folder as your vault root |
| 🔗 **Wikilinks** | Navigate between notes using Obsidian's link syntax |
| 🔍 **Search** | Find notes by title or content |
| 📎 **Attachments** | Upload images and PDFs alongside your notes |

## How It Works

1. **Connect** — Authorize DropSidian to access your Dropbox
2. **Select** — Choose your Obsidian vault folder
3. **Use** — Read, create, and edit notes from your browser

That's it. Your notes stay in Dropbox. Obsidian on your desktop sees all changes. No duplicate sync, no conflicts.

## Privacy & Security

- **Frontend-only**: No server ever sees your data
- **Your Dropbox**: Files stay in your account
- **OAuth PKCE**: Industry-standard secure authentication
- **Open source**: Inspect the code yourself

## Getting Started

Visit **[DropSidian](https://yourusername.github.io/DropSidian/)** and connect your Dropbox account.

## Development

For development setup and contribution guidelines, see the [Development Guide](docs/development_guide.md).

## License

MIT

