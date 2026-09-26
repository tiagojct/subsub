# Sub-Sub installer for Windows. https://subsub.tiagojacinto.eu
#
#   powershell -ExecutionPolicy ByPass -c "irm https://subsub.tiagojacinto.eu/install.ps1 | iex"
#
# Everything goes into your user folder; no administrator rights are needed.
#  1. uv (https://docs.astral.sh/uv/), if it is not installed yet.
#  2. Node.js 22, in ~\.subsub\node, if your Node.js is missing or older than 22.19.
#     The download is checked against the SHA-256 sums that nodejs.org publishes.
#  3. Sub-Sub (@tiagojct/subsub from npm), in ~\.subsub.
#  4. ~\.subsub and ~\.subsub\node on your user PATH.
#  5. subsub init, which asks a few questions.
#
# Settings (environment variables): SUBSUB_HOME, SUBSUB_VERSION (default latest),
# SUBSUB_NO_MODIFY_PATH=1, SUBSUB_SKIP_INIT=1, SUBSUB_OWN_NODE=1 (always use ~\.subsub\node).

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
[Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12

function Say([string]$Text) { Write-Host $Text }
# throw, not exit: with irm | iex, exit would close the window.
function Fail([string]$Text) { throw "Sub-Sub installer: $Text" }
function EnvOr([string]$Name, [string]$Default) {
    $v = [Environment]::GetEnvironmentVariable($Name)
    if ([string]::IsNullOrEmpty($v)) { return $Default } else { return $v }
}

$SubsubHome = EnvOr 'SUBSUB_HOME' (Join-Path $HOME '.subsub')
$Version = EnvOr 'SUBSUB_VERSION' 'latest'
$NodeDist = EnvOr 'SUBSUB_NODE_DIST' 'https://nodejs.org/dist/latest-v22.x'
$UvInstaller = EnvOr 'SUBSUB_UV_INSTALLER' 'https://astral.sh/uv/install.ps1'

function Test-NodeOk {
    $node = Get-Command node -ErrorAction SilentlyContinue
    if (-not $node) { return $false }
    try { $v = (& $node.Source -p 'process.versions.node').Trim() } catch { return $false }
    $parts = $v.Split('.')
    $major = [int]$parts[0]; $minor = [int]$parts[1]
    return ($major -gt 22) -or ($major -eq 22 -and $minor -ge 19)
}

switch ($env:PROCESSOR_ARCHITECTURE) {
    'AMD64' { $Arch = 'x64' }
    'ARM64' { $Arch = 'arm64' }
    default { Fail "unsupported processor: $($env:PROCESSOR_ARCHITECTURE)." }
}

New-Item -ItemType Directory -Force -Path $SubsubHome | Out-Null
$Tmp = Join-Path ([IO.Path]::GetTempPath()) ("subsub-" + [Guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Force -Path $Tmp | Out-Null

try {
    # 1. uv
    $uvHere = (Get-Command uv -ErrorAction SilentlyContinue) -or (Test-Path (Join-Path $HOME '.local\bin\uv.exe')) -or (Test-Path (Join-Path $HOME '.cargo\bin\uv.exe'))
    if ($uvHere) {
        Say 'uv: already installed.'
    } else {
        Say 'uv: installing (astral.sh) ...'
        # In a separate PowerShell, so that the uv installer cannot end this one.
        & powershell -NoProfile -ExecutionPolicy ByPass -Command "irm $UvInstaller | iex"
        if ($LASTEXITCODE -ne 0) { Fail 'the uv installer failed.' }
    }

    # 2. Node.js
    $OwnNode = Join-Path $SubsubHome 'node'
    if ((EnvOr 'SUBSUB_OWN_NODE' '0') -ne '1' -and (Test-NodeOk)) {
        $Npm = 'npm.cmd'
        Say "Node.js: using $((Get-Command node).Source)."
    } elseif ((EnvOr 'SUBSUB_OWN_NODE' '0') -ne '1' -and (Test-Path (Join-Path $OwnNode 'node.exe'))) {
        $env:Path = "$OwnNode;$env:Path"
        $Npm = Join-Path $OwnNode 'npm.cmd'
        Say "Node.js: using $OwnNode."
    } else {
        Say "Node.js: installing Node.js 22 in $OwnNode ..."
        $sums = (Invoke-WebRequest -UseBasicParsing "$NodeDist/SHASUMS256.txt").Content
        $line = ($sums -split "`n") | Where-Object { $_ -match "\snode-v22\.[0-9.]+-win-$Arch\.zip$" } | Select-Object -First 1
        if (-not $line) { Fail "no Node.js 22 download for win-$Arch." }
        $sum, $file = ($line.Trim() -split '\s+')
        $zip = Join-Path $Tmp $file
        Invoke-WebRequest -UseBasicParsing "$NodeDist/$file" -OutFile $zip
        if ((Get-FileHash -Algorithm SHA256 $zip).Hash.ToLower() -ne $sum.ToLower()) { Fail 'the Node.js download does not match its checksum.' }
        Expand-Archive -Path $zip -DestinationPath $Tmp -Force
        if (Test-Path $OwnNode) { Remove-Item -Recurse -Force $OwnNode }
        Move-Item (Join-Path $Tmp ($file -replace '\.zip$', '')) $OwnNode
        $env:Path = "$OwnNode;$env:Path"
        $Npm = Join-Path $OwnNode 'npm.cmd'
        Say "Node.js: $(& (Join-Path $OwnNode 'node.exe') -v) installed."
    }

    # 3. Sub-Sub
    Say "Sub-Sub: installing @tiagojct/subsub@$Version in $SubsubHome ..."
    & $Npm install --global --prefix $SubsubHome --no-fund --no-audit --no-update-notifier --loglevel=error "@tiagojct/subsub@$Version"
    if ($LASTEXITCODE -ne 0) { Fail 'npm could not install @tiagojct/subsub.' }
    $env:Path = "$SubsubHome;$env:Path"
    $Subsub = Join-Path $SubsubHome 'subsub.cmd'
    Say "Sub-Sub: $(& $Subsub --version)."

    # 4. User PATH
    if ((EnvOr 'SUBSUB_NO_MODIFY_PATH' '0') -ne '1') {
        $userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
        if ($null -eq $userPath) { $userPath = '' }
        $parts = $userPath.Split(';') | Where-Object { $_ -ne '' }
        $add = @($SubsubHome, $OwnNode) | Where-Object { $parts -notcontains $_ }
        if ($add.Count -gt 0) {
            [Environment]::SetEnvironmentVariable('Path', (($add + $parts) -join ';'), 'User')
            Say "PATH: added $($add -join ', ') to your user PATH."
        }
    }

    # 5. Settings
    if ((EnvOr 'SUBSUB_SKIP_INIT' '0') -eq '1') {
        Say 'Skipped subsub init (SUBSUB_SKIP_INIT=1).'
    } else {
        Say ''
        & $Subsub init
        if ($LASTEXITCODE -ne 0) { Say 'subsub init did not finish. Type subsub init later.' }
    }

    Say ''
    Say 'Done. Open a new terminal window, then type: subsub doctor'
    Say 'Docs: https://subsub.tiagojacinto.eu'
} finally {
    Remove-Item -Recurse -Force $Tmp -ErrorAction SilentlyContinue
}
