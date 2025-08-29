// Test project discovery
const { ProjectDiscovery } = require('./dist/dashboard/project-discovery');

async function testDiscovery() {
  console.log('🔍 Testing Project Discovery...\n');
  
  const discovery = new ProjectDiscovery();
  
  try {
    console.log('Current directory:', process.cwd());
    console.log('Looking for .claude directory...');
    
    const fs = require('fs');
    
    // Check if .claude directory exists
    if (fs.existsSync('.claude')) {
      console.log('✅ .claude directory found');
      
      if (fs.existsSync('.claude/specs')) {
        console.log('✅ .claude/specs directory found');
        
        const specs = fs.readdirSync('.claude/specs');
        console.log('Specs found:', specs);
      } else {
        console.log('❌ .claude/specs directory not found');
      }
      
      if (fs.existsSync('.claude/active')) {
        console.log('✅ .claude/active file found');
        const active = fs.readFileSync('.claude/active', 'utf8').trim();
        console.log('Active spec:', active);
      } else {
        console.log('❌ .claude/active file not found');
      }
    } else {
      console.log('❌ .claude directory not found');
    }
    
    console.log('\nRunning project discovery...');
    const projects = await discovery.discoverProjects();
    
    console.log(`Found ${projects.length} projects:`);
    projects.forEach(project => {
      console.log(`- ${project.name} at ${project.path}`);
      console.log(`  Active session: ${project.hasActiveSession}`);
      console.log(`  Specs: ${project.specCount}, Bugs: ${project.bugCount}`);
    });
    
  } catch (error) {
    console.error('❌ Discovery test failed:', error);
  }
}

testDiscovery();