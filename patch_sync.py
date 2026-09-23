import re

with open('frontend/src/db/syncEngine.ts', 'r') as f:
    content = f.read()

content = content.replace(
    '''  start() {
    // Initial sync
    this.sync();
    // Periodic sync every 30 seconds
    this.intervalId = setInterval(() => this.sync(), 30000);
    // Sync on reconnect
    this.onlineHandler = () => this.sync();
    window.addEventListener('online', this.onlineHandler);
  }''',
    '''  start() {
    if (this.intervalId) return;
    // Initial sync
    this.sync();
    // Periodic sync every 30 seconds
    this.intervalId = setInterval(() => this.sync(), 30000);
    // Sync on reconnect
    this.onlineHandler = () => this.sync();
    window.addEventListener('online', this.onlineHandler);
  }'''
)

with open('frontend/src/db/syncEngine.ts', 'w') as f:
    f.write(content)
