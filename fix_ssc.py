import subprocess, json, base64

REPO = 'Simon404Error/get_jobs'
FILE = 'src/main/java/com/getjobs/application/config/StaticServerConfiguration.java'

def api(*args):
    result = subprocess.run(['gh', 'api'] + list(args), capture_output=True, text=True, encoding='utf-8', errors='replace')
    return json.loads(result.stdout)

# Get file
file_data = api(f'repos/{REPO}/contents/{FILE}')
content = base64.b64decode(file_data['content'].replace('\n', '')).decode('utf-8')

# Fix 1: GET -> HEAD
old1 = '.setRequestMethod("GET");'
new1 = '.setRequestMethod("HEAD");'
content = content.replace(old1, new1)

# Fix 2: Wrap getResponseCode in try-catch
old2 = '''                int responseCode = connection.getResponseCode();
                connection.disconnect();

                if (responseCode >= 200 && responseCode < 500) {
                    return true;
                }'''

new2 = '''                int responseCode;
                try {
                    responseCode = connection.getResponseCode();
                } catch (IOException e) {
                    // 3xx response triggers IOException on some JVMs, but means server is alive
                    connection.disconnect();
                    return true;
                }
                connection.disconnect();

                if (responseCode >= 200 && responseCode < 500) {
                    return true;
                }'''

content = content.replace(old2, new2)
print('Patches applied.')

# Create blob
b64 = base64.b64encode(content.encode('utf-8')).decode('ascii')
blob = json.loads(subprocess.run(
    ['gh', 'api', f'repos/{REPO}/git/blobs', '-f', f'content={b64}', '-f', 'encoding=base64'],
    capture_output=True, text=True, encoding='utf-8'
).stdout)

# Get ref and commit tree
ref = api(f'repos/{REPO}/git/ref/heads/main')
commit = api(f'repos/{REPO}/git/commits/{ref["object"]["sha"]}')

# Create tree
tree = json.loads(subprocess.run([
    'gh', 'api', f'repos/{REPO}/git/trees',
    '-f', f'base_tree={commit["tree"]["sha"]}',
    '-f', f'tree[][path]={FILE}',
    '-f', 'tree[][mode]=100644',
    '-f', 'tree[][type]=blob',
    '-f', f'tree[][sha]={blob["sha"]}'
], capture_output=True, text=True, encoding='utf-8').stdout)

# Create commit
new_commit = json.loads(subprocess.run([
    'gh', 'api', f'repos/{REPO}/git/commits',
    '-f', 'message=fix: GET改HEAD + getResponseCode异常捕获，修复前端检测307导致的端口冲突',
    '-f', f'tree={tree["sha"]}',
    '-f', f'parents[]={commit["sha"]}'
], capture_output=True, text=True, encoding='utf-8').stdout)

# Push
result = subprocess.run([
    'gh', 'api', f'repos/{REPO}/git/refs/heads/main',
    '-X', 'PATCH', '-f', f'sha={new_commit["sha"]}', '-F', 'force=false'
], capture_output=True, text=True, encoding='utf-8')
print(f'Pushed: {new_commit["sha"]}' if result.returncode == 0 else f'ERROR: {result.stderr[:300]}')
