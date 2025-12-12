FROM node:20-alpine

# Set working directory
WORKDIR /usr/app

# Install PM2 globally
RUN npm install --global pm2

# Copy "package.json" and "package-lock.json" before other files
# Utilise Docker cache to save re-installing dependencies if unchanged
COPY ./package*.json ./

# Install dependencies
RUN npm install

# Copy all files
COPY ./ ./

# Accept build arguments for Next.js environment variables
ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}

# Build app (swcMinify is disabled in next.config.mjs to avoid ARM64 binary issues)
RUN npm run build

# Create cache directory with proper permissions
RUN mkdir -p .next/cache/images && \
    chown -R node:node /usr/app/.next

# Expose the listening port
EXPOSE 3000

# Run container as non-root (unprivileged) user
# The "node" user is provided in the Node.js Alpine base image
USER node

# Launch app with PM2
CMD [ "pm2-runtime", "start", "npm", "--", "start" ]
