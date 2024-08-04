$folderLocation = (Get-Item .).FullName;

#need to delete the chrome folders and node modules
Remove-Item $folderLocation/chrome -Force -Recurse
Remove-Item $folderLocation/chromedriver -Force -Recurse
Remove-Item $folderLocation/config/chrome-win64 -Force -Recurse
Remove-Item $folderLocation/node_modules -Force -Recurse

npx @puppeteer/browsers install chrome@stable
npx @puppeteer/browsers install chromedriver@stable

#Copy new chrome across
Copy-Item $folderLocation/chrome/*/chrome-win64/ -Destination $folderLocation/config/
Copy-Item $folderLocation/chrome/*/chrome-win64/* -Destination $folderLocation/config/chrome-win64 -Recurse
Copy-Item $folderLocation/chromedriver/*/*/chromedriver.exe -Destination $folderLocation/config/chromedriver/lib/chromedriver/ -Force

Remove-Item $folderLocation/chrome -Force -Recurse
Remove-Item $folderLocation/chromedriver -Force -Recurse

npm install