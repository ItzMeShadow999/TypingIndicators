<div align="center">

<img src="https://github.com/ItzMeShadow999/My-assets/blob/main/TypingIndicators.png?raw=true" alt="TypingIndicators" width="180">

<h1>TypingIndicators</h1>

<p>
  <a href="https://github.com/ItzMeShadow999/TypingIndicators/blob/main/LICENSE"><img src="https://img.shields.io/github/license/ItzMeShadow999/TypingIndicators?style=flat-square&labelColor=111111&color=5A5955" alt="License"></a>
  <a href="https://github.com/ItzMeShadow999/TypingIndicators/stargazers"><img src="https://img.shields.io/github/stars/ItzMeShadow999/TypingIndicators?style=flat-square&labelColor=111111&color=5A5955" alt="Stars"></a>
  <a href="https://github.com/ItzMeShadow999/TypingIndicators/commits/main"><img src="https://img.shields.io/github/last-commit/ItzMeShadow999/TypingIndicators?style=flat-square&labelColor=111111&color=5A5955" alt="Last commit"></a>
  <a href="https://github.com/ItzMeShadow999/TypingIndicators/issues"><img src="https://img.shields.io/github/issues/ItzMeShadow999/TypingIndicators?style=flat-square&labelColor=111111&color=5A5955" alt="Issues"></a>
</p>

<p>
  <img src="https://img.shields.io/badge/Vencord-supported-111111?style=flat-square&labelColor=111111&color=5A5955" alt="Vencord">
  <img src="https://img.shields.io/badge/Equicord-supported-111111?style=flat-square&labelColor=111111&color=5A5955" alt="Equicord">
  <img src="https://img.shields.io/badge/TypeScript-plugin-111111?style=flat-square&labelColor=111111&color=5A5955" alt="TypeScript">
  <img src="https://img.shields.io/badge/installer-PowerShell-111111?style=flat-square&labelColor=111111&color=5A5955" alt="PowerShell installer">
</p>

</div>

Shows other users' custom typing indicators (emojis, status word, animation) in Discord's native typing bar. Works as a userplugin for Vencord and Equicord.

## Install

Windows, PowerShell:

```powershell
irm https://raw.githubusercontent.com/ItzMeShadow999/TypingIndicators/main/install.ps1 | iex
```

The installer will:

- ▸ ask for Vencord or Equicord
- ▸ install Git, Node.js and pnpm if missing (via winget)
- ▸ clone the client, or use your existing source folder
- ▸ copy `TypingIndicators` into `src\userplugins`
- ▸ close Discord, build, inject, enable the plugin and relaunch

### ▪ Unattended options

Set these environment variables before running the one-liner to skip prompts.

| Variable | Meaning |
| --- | --- |
| `TI_CLIENT` | `vencord` or `equicord` |
| `TI_DIR` | Folder to clone into, or your existing source folder |
| `TI_YES` | `1` to auto-confirm prompts |

```powershell
$env:TI_CLIENT = 'vencord'; $env:TI_YES = '1'
irm https://raw.githubusercontent.com/ItzMeShadow999/TypingIndicators/main/install.ps1 | iex
```

### ▪ Manual install

1. Clone Vencord or Equicord from source.
2. Copy the `TypingIndicators` folder into `src/userplugins/`.
3. Run `pnpm install`, `pnpm build`, `pnpm inject`.
4. Enable TypingIndicators in Settings > Plugins.

## Settings

- ▸ Shift: left shift of the typing bar in px
- ▸ Max users: show indicators when up to this many people are typing
- ▸ Max width: max width of the typing text in px

## Disclaimer

Third-party plugin. Client mods are against Discord's ToS, use at your own risk.

##  License

[GPL-3.0](https://github.com/ItzMeShadow999/TypingIndicators/blob/main/LICENSE)
