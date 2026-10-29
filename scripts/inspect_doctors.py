import sqlite3

conn = sqlite3.connect('backend/mediverse.db')
c = conn.cursor()
c.execute('SELECT count(*) FROM doctors')
print('Doctors count in doctors table:', c.fetchone()[0])
c.execute('SELECT count(*) FROM professionals')
print('Professionals count in professionals table:', c.fetchone()[0])
c.execute("SELECT id, name, qualification, specialization, state, district, hospital_affiliation FROM professionals WHERE registration_status != 'Clinical Center' LIMIT 5")
for r in c.fetchall():
    print(r)
conn.close()

