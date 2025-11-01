#!/bin/bash

# Install additional dependencies for XML articles functionality
echo "Installing dependencies for XML articles..."

# Main dependencies
npm install uuid mammoth multer

# Development dependencies  
npm install --save-dev @types/uuid @types/multer

echo "Dependencies installed successfully!"
echo ""
echo "Note: PDF to HTML conversion is currently a placeholder:"
echo "- PDF files can be uploaded but require manual editing"
echo "- For production, consider integrating:"
echo "  * pdf2pic + tesseract for OCR"
echo "  * External services like Google Drive API"
echo "  * Commercial PDF processing services"
echo "- DOCX conversion works fully via mammoth"