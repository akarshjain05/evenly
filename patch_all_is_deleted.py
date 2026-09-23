import os

for root, _, files in os.walk('frontend/src'):
    for file in files:
        if file.endswith(('.ts', '.tsx')):
            path = os.path.join(root, file)
            with open(path, 'r') as f:
                content = f.read()
            if 'm.is_deleted === false' in content or 'm => !m.is_deleted' in content or 'm.is_deleted !== true' in content or 'group.is_deleted' in content or 'e.is_deleted === false' in content or 's.is_deleted === false' in content:
                content = content.replace('m.is_deleted === false', 'm.is_deleted !== true')
                content = content.replace('e.is_deleted === false', 'e.is_deleted !== true')
                content = content.replace('s.is_deleted === false', 's.is_deleted !== true')
                content = content.replace('group.is_deleted', 'group.is_deleted === true')
                with open(path, 'w') as f:
                    f.write(content)

