
import { getFamilyConfig } from './src/lib/familyManager';
getFamilyConfig().then(c => console.log(c.familias['fam_ms4969_piercings'] || 'not found'));
