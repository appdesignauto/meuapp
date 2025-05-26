/**
 * Emergency fix to remove the duplicate endpoint returning incorrect statistics
 * This script will locate and eliminate the problematic endpoint
 */

import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function fixDuplicateEndpoint() {
  console.log('🚨 Fixing duplicate endpoint returning incorrect statistics...');
  
  // Find and fix the reports-fixed.ts file
  const reportsFixedPath = join(__dirname, 'server', 'routes', 'reports-fixed.ts');
  
  if (fs.existsSync(reportsFixedPath)) {
    let content = fs.readFileSync(reportsFixedPath, 'utf8');
    
    // Remove any hardcoded statistics that return incorrect values
    const problematicPatterns = [
      /console\.log\('📊 \[CRITICAL ENDPOINT\][\s\S]*?resolved: 9[\s\S]*?}\);/g,
      /\[CRITICAL ENDPOINT\][\s\S]*?resolved: 9[\s\S]*?total: 13/g,
      /resolved: 9, rejected: 3, total: 13/g
    ];
    
    let wasModified = false;
    problematicPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        content = content.replace(pattern, '');
        wasModified = true;
        console.log('✅ Removed problematic hardcoded endpoint');
      }
    });
    
    if (wasModified) {
      fs.writeFileSync(reportsFixedPath, content);
      console.log('✅ Fixed reports-fixed.ts');
    }
  }
  
  console.log('🎯 Emergency fix completed!');
}

fixDuplicateEndpoint();