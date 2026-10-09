param(
  [string]$BaseUrl = 'http://127.0.0.1:5000'
)

$ErrorActionPreference = 'Stop'
$BaseUrl = $BaseUrl.TrimEnd('/')
$evidenceDirectory = Join-Path $PSScriptRoot '..\evidence'
New-Item -ItemType Directory -Force -Path $evidenceDirectory | Out-Null
$evidencePath = Join-Path $evidenceDirectory 'curl-evidence.txt'
$lines = [System.Collections.Generic.List[string]]::new()

function Invoke-CurlEvidence {
  param(
    [string]$Label,
    [string]$CommandDisplay,
    [string[]]$CurlArgs,
    [int]$ExpectedStatus = 200,
    [switch]$RedactToken,
    [string]$EvidenceFile
  )

  $curlArguments = [System.Collections.Generic.List[string]]::new()
  $tempBodyPath = $null
  for ($index = 0; $index -lt $CurlArgs.Count; $index++) {
    if ($CurlArgs[$index] -in @('-d', '--data', '--data-raw')) {
      $tempBodyPath = Join-Path $env:TEMP "book-review-curl-$([Guid]::NewGuid().ToString('N')).json"
      [System.IO.File]::WriteAllText($tempBodyPath, $CurlArgs[$index + 1], [System.Text.UTF8Encoding]::new($false))
      $curlArguments.Add('--data-binary')
      $curlArguments.Add("@$tempBodyPath")
      $index++
    } else {
      $curlArguments.Add($CurlArgs[$index])
    }
  }
  $raw = (& curl.exe --silent --show-error --write-out "`n__HTTP__%{http_code}" @curlArguments) -join "`n"
  if ($tempBodyPath) { Remove-Item -LiteralPath $tempBodyPath -Force }
  if ($LASTEXITCODE -ne 0) { throw "curl.exe failed for $Label with exit code $LASTEXITCODE" }
  $parts = $raw -split "`n__HTTP__", 2
  if ($parts.Count -ne 2) { throw "Could not parse curl status for $Label" }
  $body = $parts[0].Trim()
  $status = [int]$parts[1].Trim()
  $displayBody = $body
  if ($RedactToken) { $displayBody = [regex]::Replace($displayBody, '"token"\s*:\s*"[^"]+"', '"token":"[redacted]"') }
  $lines.Add("## $Label")
  $lines.Add("> curl.exe $CommandDisplay")
  $lines.Add("HTTP $status")
  $lines.Add($displayBody)
  $lines.Add('')
  if ($EvidenceFile) {
    $taskPath = Join-Path $evidenceDirectory $EvidenceFile
    @("## $Label", "> curl.exe $CommandDisplay", "HTTP $status", $displayBody) | Add-Content -LiteralPath $taskPath -Encoding utf8
  }
  if ($status -ne $ExpectedStatus) { throw "$Label returned HTTP $status; expected $ExpectedStatus. Response: $displayBody. See $evidencePath" }
  return [pscustomobject]@{ Status = $status; Body = $body }
}

$reader = "curl-demo-$([Guid]::NewGuid().ToString('N').Substring(0, 10))"
$otherReader = "curl-demo-$([Guid]::NewGuid().ToString('N').Substring(0, 10))"
$demoPassword = 'local-demo-password-42'
@('getallbooks.txt','getbooksbyISBN.txt','getbooksbyauthor.txt','getbooksbytitle.txt','getbookreview.txt','register.txt','login.txt','reviewadded.txt','deletereview.txt') | ForEach-Object {
  $oldEvidence = Join-Path $evidenceDirectory $_
  if (Test-Path -LiteralPath $oldEvidence) { Remove-Item -LiteralPath $oldEvidence -Force }
}

Invoke-CurlEvidence 'List all books (Task 1)' "-sS $BaseUrl/" @('-X','GET',"$BaseUrl/") -EvidenceFile 'getallbooks.txt' | Out-Null
Invoke-CurlEvidence 'Find by ISBN (Task 2)' "-sS $BaseUrl/isbn/1" @('-X','GET',"$BaseUrl/isbn/1") -EvidenceFile 'getbooksbyISBN.txt' | Out-Null
Invoke-CurlEvidence 'Find by author (Task 3)' "-sS $BaseUrl/author/Jane%20Austen" @('-X','GET',"$BaseUrl/author/Jane%20Austen") -EvidenceFile 'getbooksbyauthor.txt' | Out-Null
Invoke-CurlEvidence 'Find by title (Task 4)' "-sS $BaseUrl/title/Pride%20and%20Prejudice" @('-X','GET',"$BaseUrl/title/Pride%20and%20Prejudice") -EvidenceFile 'getbooksbytitle.txt' | Out-Null
Invoke-CurlEvidence 'Read reviews (Task 5)' "-sS $BaseUrl/review/1" @('-X','GET',"$BaseUrl/review/1") -EvidenceFile 'getbookreview.txt' | Out-Null

$registerJson = @{ username = $reader; password = $demoPassword } | ConvertTo-Json -Compress
$safeRegisterJson = "{`"username`":`"$reader`",`"password`":`"[redacted]`"}"
Invoke-CurlEvidence 'Register demo user (Task 6)' "-sS -X POST $BaseUrl/register -H 'Content-Type: application/json' -d '$safeRegisterJson'" @('-X','POST',"$BaseUrl/register",'-H','Content-Type: application/json','-d',$registerJson) -ExpectedStatus 201 -EvidenceFile 'register.txt' | Out-Null
$loginJson = @{ username = $reader; password = $demoPassword } | ConvertTo-Json -Compress
$login = Invoke-CurlEvidence 'Login and receive JWT (Task 7)' "-sS -X POST $BaseUrl/customer/login -H 'Content-Type: application/json' -d '$safeRegisterJson'" @('-X','POST',"$BaseUrl/customer/login",'-H','Content-Type: application/json','-d',$loginJson) -RedactToken -EvidenceFile 'login.txt'
$token = ($login.Body | ConvertFrom-Json).token

$otherRegisterJson = @{ username = $otherReader; password = $demoPassword } | ConvertTo-Json -Compress
Invoke-CurlEvidence 'Register second demo user' "-sS -X POST $BaseUrl/register -H 'Content-Type: application/json' -d '{`"username`":`"$otherReader`",`"password`":`"[redacted]`"}'" @('-X','POST',"$BaseUrl/register",'-H','Content-Type: application/json','-d',$otherRegisterJson) -ExpectedStatus 201 | Out-Null
$otherLogin = Invoke-CurlEvidence 'Login second demo user' "-sS -X POST $BaseUrl/customer/login -H 'Content-Type: application/json' -d '{`"username`":`"$otherReader`",`"password`":`"[redacted]`"}'" @('-X','POST',"$BaseUrl/customer/login",'-H','Content-Type: application/json','-d',$otherRegisterJson) -RedactToken
$otherToken = ($otherLogin.Body | ConvertFrom-Json).token

$reviewJson = @{ review = 'A locally captured review.' } | ConvertTo-Json -Compress
$changedReviewJson = @{ review = 'Updated by the same local user.' } | ConvertTo-Json -Compress
Invoke-CurlEvidence 'Add review with JWT (Task 8)' "-sS -X PUT '$BaseUrl/customer/auth/review/1?review=A%20locally%20captured%20review.' -H 'Authorization: Bearer [redacted]'" @('-X','PUT',"$BaseUrl/customer/auth/review/1",'-G','--data-urlencode','review=A locally captured review.','-H',"Authorization: Bearer $token") -ExpectedStatus 201 -EvidenceFile 'reviewadded.txt' | Out-Null
Invoke-CurlEvidence 'Confirm review visible (Task 8)' "-sS $BaseUrl/review/1" @('-X','GET',"$BaseUrl/review/1") -EvidenceFile 'reviewadded.txt' | Out-Null
Invoke-CurlEvidence 'Modify own review (Task 8)' "-sS -X PATCH $BaseUrl/customer/auth/review/1 -H 'Authorization: Bearer [redacted]' -H 'Content-Type: application/json' -d '{`"review`":`"[updated review text]`"}'" @('-X','PATCH',"$BaseUrl/customer/auth/review/1",'-H',"Authorization: Bearer $token",'-H','Content-Type: application/json','-d',$changedReviewJson) -EvidenceFile 'reviewadded.txt' | Out-Null
Invoke-CurlEvidence 'Reject another user modifying the review' "-sS -X PATCH $BaseUrl/customer/auth/review/1 -H 'Authorization: Bearer [redacted]'" @('-X','PATCH',"$BaseUrl/customer/auth/review/1",'-H',"Authorization: Bearer $otherToken",'-H','Content-Type: application/json','-d',$reviewJson) -ExpectedStatus 404 | Out-Null
Invoke-CurlEvidence 'Delete own review (Task 9)' "-sS -X DELETE $BaseUrl/customer/auth/review/1 -H 'Authorization: Bearer [redacted]'" @('-X','DELETE',"$BaseUrl/customer/auth/review/1",'-H',"Authorization: Bearer $token") -EvidenceFile 'deletereview.txt' | Out-Null
Invoke-CurlEvidence 'Confirm review deletion' "-sS $BaseUrl/review/1" @('-X','GET',"$BaseUrl/review/1") -EvidenceFile 'deletereview.txt' | Out-Null

while ($lines.Count -gt 0 -and [string]::IsNullOrWhiteSpace($lines[$lines.Count - 1])) { $lines.RemoveAt($lines.Count - 1) }
$lines.Insert(0, "Local cURL evidence captured $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss zzz') against $BaseUrl. JWTs and demo passwords redacted.")
$lines | Set-Content -LiteralPath $evidencePath -Encoding utf8
Write-Output "Saved reproducible local API responses to $evidencePath"
