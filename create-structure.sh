#!/bin/bash
# LandBiznes: Create New Architecture Structure
# This script creates the directory structure for the modernized system

set -e

echo "🏗️  Creating LandBiznes Modern Architecture..."
echo ""

# Create apps directory structure
echo "📁 Creating apps/ structure..."

mkdir -p apps/frontend/src/{app,components,hooks,services,utils,types,context,middleware}
mkdir -p apps/frontend/src/app/{dashboard,land,escrow,chat,auth,chatbot,admin}
mkdir -p apps/frontend/src/components/{layout,maps,forms,chat,chatbot,ui}
mkdir -p apps/frontend/public/{images,icons,favicons}

mkdir -p apps/backend/app/{config,routers,services,models,schemas,middleware,utils,dependencies,migrations}
mkdir -p apps/backend/tests

mkdir -p apps/ai-service/src/{models,services,routers,ml_models,utils}

mkdir -p apps/blockchain/{programs/{asset_registry,land_ownership,escrow_contract},idls,tests,migrations}
mkdir -p apps/blockchain/programs/{asset_registry,land_ownership,escrow_contract}/src

# Create documentation
echo "📚 Creating documentation..."
mkdir -p docs

# Create shared directory
echo "🔄 Creating shared utilities..."
mkdir -p shared/{types,constants,utils}

echo ""
echo "✅ Directory structure created!"
echo ""
echo "📋 Next steps:"
echo "1. Copy your existing code to the new locations"
echo "2. Update imports and paths"
echo "3. Create backend services by merging microservices"
echo "4. See NEW_ARCHITECTURE.md for detailed migration guide"
echo ""
