export default defineAppConfig({
  ui: {
    colors: {
      primary: 'cobalt',
      secondary: 'teal',
      success: 'emerald',
      info: 'sky',
      warning: 'amber',
      error: 'rose',
      neutral: 'slate'
    },
    button: {
      defaultVariants: {
        size: 'md'
      }
    },
    card: {
      slots: {
        root: 'ring-default'
      }
    },
    // `--ui-radius: 0.5rem` rounds the small square controls into circles,
    // which makes a checkbox read as a radio button. Pin them square-ish.
    checkbox: {
      slots: {
        base: 'rounded-[4px]'
      }
    }
  }
})
