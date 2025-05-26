-- Add mockup_urls column to brand_brains table
ALTER TABLE brand_brains
ADD COLUMN mockup_urls JSONB DEFAULT NULL;

-- Add comment to explain the column
COMMENT ON COLUMN brand_brains.mockup_urls IS 'JSON array of URLs for brand mockups (billboard, storefront, product, etc)';

-- Create an index for faster lookups
CREATE INDEX idx_brand_brains_mockup_urls ON brand_brains USING GIN (mockup_urls); 