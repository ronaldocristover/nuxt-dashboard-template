<script setup lang="ts">
import { CalendarDate, Time } from '@internationalized/date'

const fmt = useFormat()

const seats = ref(18)
const threshold = ref(1200)
const band = ref([500, 4500])
const rating = ref(4)
const pin = ref<string[]>([])
const segments = ref(['Enterprise', 'APAC'])
const brand = ref('#2d5bff')
const files = ref<File[] | null>(null)

// These two controls speak `@internationalized/date`, not `Date` — the library
// separates a calendar date from a timestamp, which is what a billing date is.
const renewsOn = shallowRef(new CalendarDate(2026, 9, 1))
const digestAt = shallowRef(new Time(9, 0))
</script>

<template>
  <PanelSection
    title="Values with structure"
    description="Numbers, dates, ranges and files. Each one stops a person having to format a value by hand."
  >
    <div class="divide-y divide-default">
      <FormsRow title="Number" description="Steppers beat free text whenever the value is small and bounded.">
        <UInputNumber v-model="seats" :min="1" :max="500" class="w-full" />
      </FormsRow>

      <FormsRow title="Number with units" description="Currency stays outside the field so the value can be selected cleanly.">
        <UInputNumber
          v-model="threshold"
          :min="0"
          :step="100"
          class="w-full"
          :format-options="{ style: 'currency', currency: 'USD', maximumFractionDigits: 0 }"
        />
      </FormsRow>

      <FormsRow title="Slider" description="For a value where the approximate position matters more than the exact number." wide>
        <div class="space-y-6 pt-1.5">
          <div>
            <USlider v-model="seats" :min="1" :max="100" />
            <p class="tnum mt-2.5 text-xs text-muted">
              {{ fmt.number(seats) }} seats
            </p>
          </div>
          <div>
            <USlider v-model="band" :min="0" :max="6000" :step="100" />
            <p class="tnum mt-2.5 text-xs text-muted">
              {{ fmt.currency(band[0] ?? 0) }} – {{ fmt.currency(band[1] ?? 0) }} MRR
            </p>
          </div>
        </div>
      </FormsRow>

      <FormsRow title="Rating" description="A bounded, ordinal judgement. Never use it for anything that needs to be averaged precisely.">
        <UInputRating v-model="rating" />
      </FormsRow>

      <FormsRow title="One-time code" description="Split fields let someone paste a whole code and still see it digit by digit.">
        <UPinInput v-model="pin" :length="6" otp />
      </FormsRow>

      <FormsRow title="Tags" description="An open-ended list where the values are not known in advance.">
        <UInputTags v-model="segments" placeholder="Add a segment" class="w-full" />
      </FormsRow>

      <FormsRow title="Date and time" description="Billing dates are calendar dates, not timestamps — they do not shift with a timezone.">
        <div class="flex flex-wrap gap-2">
          <UInputDate v-model="renewsOn" />
          <UInputTime v-model="digestAt" />
        </div>
      </FormsRow>

      <FormsRow title="Colour" description="Used by the theme editor. The value is a plain hex string.">
        <div class="flex items-center gap-3">
          <UPopover>
            <UButton color="neutral" variant="subtle">
              <span class="size-4 rounded-sm ring ring-default" :style="{ background: brand }" />
              <span class="tnum">{{ brand }}</span>
            </UButton>
            <template #content>
              <UColorPicker v-model="brand" class="p-2" />
            </template>
          </UPopover>
        </div>
      </FormsRow>

      <FormsRow title="File upload" description="State what is accepted and how large it can be, before someone picks the wrong thing." wide>
        <UFileUpload
          v-model="files"
          multiple
          variant="area"
          accept=".csv,.tsv"
          label="Drop your subscription export here"
          description="CSV or TSV, up to 10 MB"
          class="w-full"
        />
      </FormsRow>
    </div>
  </PanelSection>
</template>
