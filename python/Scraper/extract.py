import csv

input_file = 'compare.csv'          # Your input file (no header)
output_file = 'updatedCompany.csv' # Output file with only second column

with open(input_file, newline='', encoding='utf-8') as infile, \
     open(output_file, 'w', newline='', encoding='utf-8') as outfile:

    reader = csv.reader(infile)
    writer = csv.writer(outfile)

    for row in reader:
        if len(row) >= 2:
            writer.writerow([row[1]])  # Write second column value
