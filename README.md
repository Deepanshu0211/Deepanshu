# Aesthetic Bento Portfolio

A stunning, interactive, and highly aesthetic personal portfolio website featuring a dynamic **draggable bento grid layout**, randomized themes, lofi music player, and premium glassmorphism design.

Built for creatives who want to stand out.

## Features

- **Draggable Bento Grid**: Fully interactive grid system. Drag and drop items to rearrange your portfolio. The content intelligently adapts to the new slot size (e.g., Music Player shrinks to a mini-player when moved to a small slot).
- **8 Dynamic Themes**: Randomly loads one of 8 stunning color palettes on every refresh (Aurora, Sunset, Ocean, Midnight, Forest, Cherry, Gold, Noir).
- **Integrated Lofi Player**: Features a functional music player with 6+ curated Lofi stations. Plays seamlessly with a vinyl spin animation and frosted glass UI.
- **Live Quotes**: Fetches daily inspirational quotes from the [Quotable API](https://github.com/lukePeavey/quotable).
- **Ultra-Glassmorphism**: Premium frosted glass effects (`backdrop-filter: blur(50px)`), rich noise textures, and breathing background blobs.
- **Performance First**: Built with Vite and React for instant load times and 60fps animations via Framer Motion.
- **Responsive**: Adapts gracefully from a complex desktop grid to a clean vertical mobile layout.

## Tech Stack

- **Framework**: [React](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Styling**: Pure CSS + CSS Variables for dynamic theming
- **Fonts**: Clash Display & Instrument Serif

## Getting Started

1.  **Clone the repository**
    ```bash
    git clone https://github.com/Deepanshu0211/Portfollio.git
    cd aesthetic-portfolio
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Run Development Server**
    ```bash
    npm run dev
    ```

4.  **Build for Production**
    ```bash
    npm run build
    ```

## Customization

- **Profile**: Edit the `Profile` component in `src/App.jsx` to change your name and details.
- **Links**: Update the `href` attributes in the `gh` (GitHub), `li` (LinkedIn), and `x` (Twitter) blocks.
- **Music**: Add more stations to the `LOFI_STATIONS` array in `src/App.jsx`.
- **Contact**: Update the `mailto:` email in the `Notify` block.

## License

MIT License. Free to use and modify for your own personal portfolio.

---

*Made by Deepanshu*
