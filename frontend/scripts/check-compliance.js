const fs = require('fs');
const path = require('path');

/**
 * ELITE COMPLIANCE AUDIT (Security 9.8+)
 * Scans app/api for:
 * 1. Missing secureRoute wrapper
 * 2. UNSAFE Query Patterns (findById, findOne with _id only, etc.)
 * 3. Role-based structural bypasses (checking role names instead of permissions)
 */

const API_DIR = path.join(process.cwd(), 'app', 'api');
const LIB_DIR = path.join(process.cwd(), 'lib');

const UNSAFE_PATTERNS = [
    { name: 'findById', regex: /\.findById\(/g },
    { name: 'findOneById', regex: /\.findOne\(\s*\{\s*_id:/g },
    { name: 'directIdMatch', regex: /\{\s*_id:\s*[^,}]+\s*\}/g },
];

function scanDirectory(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            scanDirectory(fullPath);
        } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
            checkCompliance(fullPath);
        }
    });
}

function checkCompliance(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const relPath = path.relative(process.cwd(), filePath);

    let isNonCompliant = false;

    // 1. Check for secureRoute wrapper in API files
    if (filePath.includes('app' + path.sep + 'api') && filePath.endsWith('route.js')) {
        const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
        methods.forEach(method => {
            const regex = new RegExp(`export const ${method}\\s*=`, 'g');
            if (regex.test(content) && !content.includes('secureRoute(')) {
                console.error(`[FAIL] [NO_WRAPPER] Missing secureRoute in ${relPath} (${method})`);
                isNonCompliant = true;
            }
        });
    }

    // 2. Check for UNSAFE query patterns
    UNSAFE_PATTERNS.forEach(pattern => {
        if (relPath.includes('lib' + path.sep + 'rbac.js') || relPath.includes('models' + path.sep)) return;
        let match;
        while ((match = pattern.regex.exec(content)) !== null) {
            if (!content.includes('getTenantScopedQuery') && !content.includes('getScopedQuery')) {
                console.error(`[FAIL] [UNSAFE_PATTERN] Detected ${pattern.name} in ${relPath} at index ${match.index}`);
                isNonCompliant = true;
            }
        }
    });

    // 3. ENFORCE Permission-Based Logic (Structural Bypass Check)
    if (content.includes("role === '") || content.includes('role === "') || content.includes(".role === '") || content.includes('.role === "')) {
        // Allow in roles.js and seed routes
        if (!relPath.includes('data/roles.js') && !relPath.includes('seed')) {
            console.error(`[FAIL] [STRUCTURAL_BYPASS] Detected direct role name comparison in ${relPath}. Use hasPermission() instead.`);
            isNonCompliant = true;
        }
    }

    if (!isNonCompliant && filePath.endsWith('route.js')) {
        // console.log(`[PASS] ${relPath}`);
    } else if (isNonCompliant) {
        process.exitCode = 1;
    }
}

console.log('--- Starting ELITE Security Compliance Audit (9.8+) ---');
scanDirectory(API_DIR);
scanDirectory(LIB_DIR);
console.log('--- Compliance Audit Finished ---');
