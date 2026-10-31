# Serves the website at http://localhost:8080 for previewing on this computer.
# Usage: powershell -ExecutionPolicy Bypass -File tools\serve.ps1
param([int]$Port = 8080)
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path  # the whole site: author pages, drone/, privacy and terms
$types = @{ '.html'='text/html; charset=utf-8'; '.css'='text/css'; '.js'='text/javascript'; '.mp4'='video/mp4'; '.jpg'='image/jpeg'; '.png'='image/png'; '.svg'='image/svg+xml'; '.ico'='image/x-icon'; '.json'='application/json' }
$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Serving $root at http://localhost:$Port/"
while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $req = $ctx.Request; $res = $ctx.Response
  try {
    $rel = [Uri]::UnescapeDataString($req.Url.AbsolutePath.TrimStart('/'))
    if ($rel -eq '') { $rel = 'index.html' }
    $path = [IO.Path]::GetFullPath((Join-Path $root $rel))
    if (Test-Path $path -PathType Container) {
      if (-not $rel.EndsWith('/')) { $res.Redirect("/$rel/"); $res.Close(); continue }
      $path = Join-Path $path 'index.html'
    }
    if (-not $path.StartsWith($root) -or -not (Test-Path $path -PathType Leaf)) {
      $res.StatusCode = 404; $res.Close(); continue
    }
    $ext = [IO.Path]::GetExtension($path).ToLower()
    $res.ContentType = $(if ($types[$ext]) { $types[$ext] } else { 'application/octet-stream' })
    $res.Headers['Accept-Ranges'] = 'bytes'
    $fs = [IO.File]::OpenRead($path)
    $len = $fs.Length; $start = 0; $end = $len - 1
    $range = $req.Headers['Range']
    if ($range -match 'bytes=(\d*)-(\d*)') {
      if ($Matches[1]) { $start = [long]$Matches[1] }
      if ($Matches[2]) { $end = [Math]::Min([long]$Matches[2], $len - 1) }
      $res.StatusCode = 206
      $res.Headers['Content-Range'] = "bytes $start-$end/$len"
    }
    $count = $end - $start + 1
    $res.ContentLength64 = $count
    $fs.Position = $start
    $buf = New-Object byte[] 65536
    while ($count -gt 0) {
      $n = $fs.Read($buf, 0, [Math]::Min($buf.Length, $count))
      if ($n -le 0) { break }
      $res.OutputStream.Write($buf, 0, $n); $count -= $n
    }
    $fs.Close()
  } catch { } finally { try { $res.Close() } catch { } }
}
