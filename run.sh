cwd=`pwd`
options="--disable-web-security --user-data-dir=${cwd}/.chrome --app=file://${cwd}/index.html $@"
chrome $options || chromium $options
