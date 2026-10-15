# Birthday Memory Template

This project recreates the six reference scenes: a cinema countdown, a birthday reveal, an editorial photo ribbon, a Polaroid collage, an interactive scrapbook, and a floating photo universe. The provided screenshots supplied the visual references and temporary photo crops. Replace those crops with original photos for the sharpest result.

## Personalize the experience

Edit `src/config/birthdayConfig.ts`. It is the main place for names, the birthday date and timezone, scene visibility, wording, captions, image paths, scrapbook pages, and audio settings. The React components and CSS handle layout and animation; ordinary personalization does not require changing them.

### Change the recipient, age, and countdown

In the `recipient` section, update `name`, `nickname`, `age`, `birthdayDate`, `birthdayTime`, and `timezone`. The recipient name is used by the reveal and editorial heading, and the nickname is used in the cinema credit and closing signature. The countdown, ticker date, and cinema subtitle all read the configured birthday date. The example is set to Sweety's 23rd birthday on November 11, 2026 at midnight in Asia/Dhaka.

Dates use `YYYY-MM-DD`, times use 24-hour `HH:MM:SS`, and timezones use IANA names such as `Asia/Dhaka` or `America/New_York`. If you do not know the date yet, leave it empty; the countdown will show a setup message instead of inventing one.

### Replace the hero image

Put a landscape image in `public/images/` and set `reveal.backgroundImage` to its path, for example `/images/hero.jpg`. The supplied `/images/hero-dusk.svg` is a small atmospheric illustration shaped after the dusk reference. The dark treatment keeps text readable over the image.

### Replace, add, remove, or reorder photos

The starter includes ten photo crops in `public/images/gallery/`. They were taken from the supplied reference screenshots to make the first run feel populated; they are preview-quality crops. For the best result, replace each file with the original photograph and keep its filename. You can also add a photo file there and update the matching `src` field in `birthdayConfig.ts`.

The ribbon, Polaroids, scrapbook, and floating universe each read their own photo arrays from the configuration. Add an item to add a card, remove an item to remove one, or change array order to rearrange them. Give each ribbon, gallery, and universe photo a unique `id`. Captions, alt text, card size, sticker, rotation, and universe position are editable beside each photo path.

If a configured image cannot be found, the site shows a designed placeholder instead of a broken image. In development, the browser console reports the missing path.

### Customize the Polaroids and scrapbook

Change `gallery.photos` to update Polaroid captions, rotation, size, alt text, and decorations. Supported sticker values include `heart`, `sparkle`, `flower`, and `butterfly`.

Each item in `scrapbook.pages` supplies that page's title, paper tone, photos, notes, and stickers. The album calculates its page total and navigation limits from this array. `initialPage` selects the opening page. PREV and NEXT move through the eight default pages, and the Escape key closes the album.

### Music and scene visibility

Add an audio file under `public/audio/`, set `audio.src`, and change `audio.enabled` to `true`. Music starts only after the visitor presses Play. Set it to `false` to remove the controls.

Use each scene's `enabled` value to hide that experience. The scene index and continue buttons skip disabled scenes. `photoRibbon.enabled` controls the ribbon within the introduction. `preferences.reducedMotion` can turn animations off for everyone; the site also respects the visitor's operating-system reduced-motion setting.

## Preview and build

Install the listed project dependencies, then run `npm run dev` from the project folder and open the local address shown in the terminal. Use `npm run build` to create the deployable static site in `dist/`.

To deploy, upload the contents of `dist/` to a static hosting service that supports single-page Vite apps. Keep the `public/images/` and `public/audio/` paths intact when replacing assets. No backend, account, analytics, or database is required.

## Project map

- `src/config/birthdayConfig.ts` — editable birthday content and visual choices.
- `src/App.tsx` — six scenes, navigation, countdown presentation, album, photo viewer, and audio controls.
- `src/hooks/useCountdown.ts` and `src/lib/time.ts` — timezone-aware countdown.
- `src/lib/validateConfig.ts` — startup checks for important configuration fields.
- `src/styles.css` — responsive layouts, transitions, and motion.
- `public/images/` — replaceable photographs and the dusk illustration.
