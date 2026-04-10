<template>
  <UContainer class="h-screen flex items-center justify-center text-center">
    <UCard class="w-full max-w-md x-auto">
      <template #header>
        <h3 class="text-xl font-bold font-display">Send Feedback</h3>
        <p class="text-sm text-gray-400">Help us improve Archidome</p>
      </template>

      <form
        name="feedback-archidome"
        method="POST"
        action="/success"
        data-netlify="true"
        data-netlify-honeypot="bot-field"
        @submit.native
      >
        <input type="hidden" name="form-name" value="feedback-archidome" />

        <input type="hidden" name="bot-field" />

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">Your Name</label>
            <input
              type="text"
              name="name"
              required
              class="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">Feedback Type</label>
            <select
              name="type"
              class="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white outline-none"
            >
              <option>Bug Report</option>
              <option>Feature Request</option>
              <option>Other</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">Message</label>
            <textarea
              name="message"
              required
              rows="4"
              class="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white outline-none"
            ></textarea>
          </div>

          <button
            type="submit"
            class="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-700 hover:bg-primary-900 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Submit Feedback
          </button>
        </div>
      </form>
    </UCard>
  </UContainer>
</template>
