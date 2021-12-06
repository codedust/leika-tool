echo -n 'num lines old file: '
wc -l web/leika.csv

DATE=`date --iso-8601=seconds`
mv web/leika.csv web/leika-$DATE.csv

poetry run python download-leika.py

echo -n 'num lines new file: '
wc -l web/leika.csv
