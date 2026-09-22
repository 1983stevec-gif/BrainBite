param(
  [string]$Executable = "src-tauri\target\release\brainbite.exe",
  [int]$StartupSeconds = 10
)

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$executablePath = if ([System.IO.Path]::IsPathRooted($Executable)) { $Executable } else { Join-Path $repoRoot $Executable }
if (-not (Test-Path -LiteralPath $executablePath -PathType Leaf)) {
  throw "BrainBite executable not found: $executablePath. Run npm run native:build first."
}

$process = Start-Process -FilePath $executablePath -PassThru
try {
  Start-Sleep -Seconds $StartupSeconds
  if ($process.HasExited) { throw "BrainBite exited during startup with code $($process.ExitCode)." }
  $process.Refresh()
  if ($process.MainWindowHandle -eq 0 -or $process.MainWindowTitle -ne 'BrainBite') {
    throw "BrainBite did not open its expected native window."
  }

  $processIds = @($process.Id)
  $remainingParents = @($process.Id)
  while ($remainingParents.Count -gt 0) {
    $children = @(Get-CimInstance Win32_Process | Where-Object { $remainingParents -contains [int]$_.ParentProcessId })
    $childIds = @($children | ForEach-Object { [int]$_.ProcessId })
    $processIds += $childIds
    $remainingParents = $childIds
  }
  $processIds = @($processIds | Sort-Object -Unique)
  $listeners = @(Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $processIds -contains [int]$_.OwningProcess })
  if ($listeners.Count -gt 0) {
    $details = $listeners | ForEach-Object { "$($_.LocalAddress):$($_.LocalPort) pid=$($_.OwningProcess)" }
    throw "Packaged BrainBite opened a TCP listener: $($details -join ', ')"
  }
  Write-Output "PASS: The BrainBite native window and its child processes opened without a TCP listening port (PIDs: $($processIds -join ', '))."
}
finally {
  if (-not $process.HasExited) { Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue }
}
