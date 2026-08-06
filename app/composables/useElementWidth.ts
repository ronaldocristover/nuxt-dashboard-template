/**
 * Tracks an element's rendered width so charts can be drawn in real pixels
 * rather than scaled from a fixed viewBox.
 *
 * Drawing in pixel space is what keeps a 1px gridline exactly 1px and a 12px
 * axis label exactly 12px, whether the chart is 360px or 1200px wide.
 */
export function useElementWidth(fallback = 640) {
  const el = ref<HTMLElement | null>(null)
  const width = ref(fallback)

  let observer: ResizeObserver | null = null

  onMounted(() => {
    if (!el.value) return

    // `ResizeObserver` catches sidebar collapse and panel resize too, which a
    // window resize listener would miss.
    observer = new ResizeObserver((entries) => {
      const measured = entries[0]?.contentRect.width
      if (measured && measured > 0) width.value = measured
    })

    observer.observe(el.value)
    width.value = el.value.clientWidth || fallback
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
    observer = null
  })

  return { el, width }
}
