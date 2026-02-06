FROM ghcr.io/puppeteer/puppeteer:21.11.0

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
# We use npm ci for a clean, deterministic install
# The base image already has Puppeteer installed, but we need to install project dependencies
# We skip Puppeteer download here because the base image provides it
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

RUN npm ci --omit=dev

# Copy the rest of the application code
COPY . .

# Create uploads directory and ensure it has correct permissions
USER root
RUN mkdir -p uploads && chown -R pptruser:pptruser uploads
USER pptruser

# Expose the port the app runs on
EXPOSE 5000

# Start the application
CMD [ "npm", "start" ]
