import sys

path = '/Users/zhting/Documents/积木游戏/index.html'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Looking for lines around 701
# 700:             <h2 style="text-align: center;">📖 游戏说明</h2>
# 701:                     🏙️ <b>全自动升降机：</b> 碰碰运气，体验解放双手的快乐。
# ...
# 707:             <button class="btn-primary" onclick="closeInstructionsModal()">我知道了</button>

start_index = -1
end_index = -1

for i, line in enumerate(lines):
    if '<h2 style="text-align: center;">📖 游戏说明</h2>' in line:
        start_index = i + 1
    if 'onclick="closeInstructionsModal()"' in line and start_index != -1:
        end_index = i
        break

if start_index != -1 and end_index != -1:
    new_lines = lines[:start_index]
    new_lines.append('            <div id="instructionsContent" style="margin-bottom: 20px; color: #666; line-height: 1.6; font-size: 15px;">\n')
    new_lines.append('                <!-- 动态注入内容 -->\n')
    new_lines.append('            </div>\n')
    new_lines.extend(lines[end_index:])
    
    with open(path, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    print("Success")
else:
    print(f"Failed: start={start_index}, end={end_index}")
