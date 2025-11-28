#!/bin/bash

# Load environment variables from .env.local
set -a
source .env.local
set +a

# Run the integration test
npx tsx scripts/test-integration.ts
