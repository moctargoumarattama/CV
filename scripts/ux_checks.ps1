$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$index = Get-Content (Join-Path $root "index.html") -Raw
$css = Get-Content (Join-Path $root "style.css") -Raw
$js = Get-Content (Join-Path $root "script.js") -Raw

$competences = "Comp$([char]0x00E9)tences"
$energie = "$([char]0x00C9)nergie"
$telecharger = "T$([char]0x00E9)l$([char]0x00E9)charger"

$checks = @(
    @{ Name = "Page progress markup"; Pass = $index -match 'class="page-progress"' },
    @{ Name = "Floating summary markup"; Pass = $index -match 'class="floating-summary"' },
    @{ Name = "Project count markup"; Pass = $index -match 'id="project-count"' },
    @{ Name = "Progress script"; Pass = $js -match 'updatePageProgress' },
    @{ Name = "Active section script"; Pass = $js -match 'summaryLinks' },
    @{ Name = "Project count script"; Pass = $js -match 'updateProjectCount' },
    @{ Name = "Desktop-only floating summary"; Pass = $css -match 'floating-summary' -and $css -match 'min-width: 1041px' },
    @{ Name = "Mobile project more button markup"; Pass = $index -match 'id="projects-more"' },
    @{ Name = "Mobile project limit script"; Pass = $js -match 'updateProjectLimit' },
    @{ Name = "Hamburger active link script"; Pass = $js -match 'navSectionLinks' },
    @{ Name = "Hamburger active link style"; Pass = $css -match '\.nav-menu a\.active' },
    @{ Name = "French accents in navigation"; Pass = $index -match $competences -and $index -match $energie -and $index -match $telecharger },
    @{ Name = "Monitoring spelling fixed"; Pass = $index -notmatch 'monotoring' }
)

$failed = $checks | Where-Object { -not $_.Pass }

if ($failed) {
    $failed | ForEach-Object { Write-Host "FAIL: $($_.Name)" }
    exit 1
}

$checks | ForEach-Object { Write-Host "PASS: $($_.Name)" }
