import re

images = [
    {
        "file": "Veil of Apostles MOCKED ON BARN FLOOR.png",
        "title": "Veil of Apostles",
        "kicker": "Handmade Original",
        "desc": "Atmospheric, handcrafted artwork bringing deep mood to any space."
    },
    {
        "file": "Weathered Edge MOCKED ON FLOOR NEAR WINDOW.png",
        "title": "Weathered Edge",
        "kicker": "Handmade Original",
        "desc": "A textured, handcrafted piece with worn, natural characteristics."
    },
    {
        "file": "a_hanging_bouquet_of_flowers MOCKED IN SCANDINAVIAN LVIING ROOM.png",
        "title": "A Hanging Bouquet of Flowers",
        "kicker": "1800s Reproduction",
        "desc": "A classic restored 1800s piece bringing vintage floral charm to modern walls."
    },
    {
        "file": "a_quiet_day_near_manchester MOCKED IN BOHO LIVING ROOM.png",
        "title": "A Quiet Day Near Manchester",
        "kicker": "1800s Reproduction",
        "desc": "Elegant reproduction of traditional landscape art, perfectly balanced for contemporary interiors."
    },
    {
        "file": "beach_in_normandy MOCKED IN ULTRAMODERN ART GALLERY.png",
        "title": "Beach in Normandy",
        "kicker": "1800s Reproduction",
        "desc": "A carefully restored 1800s reproduction capturing coastal light and historical atmosphere."
    },
    {
        "file": "blackberries_spilling_from_tin_cup MOCKED IN BOOK NOOK.png",
        "title": "Blackberries Spilling From Tin Cup",
        "kicker": "1800s Reproduction",
        "desc": "Classic still-life reproduction, adding quiet depth to reading nooks or dining spaces."
    },
    {
        "file": "boats_carrying_out_anchors_to_the_dutch_men_of_war MOCKED IN INDOOR GREENHOUSE.png",
        "title": "Boats Carrying Out Anchors",
        "kicker": "1800s Reproduction",
        "desc": "A dramatic maritime reproduction from the 1800s, preserved with sharp detail."
    },
    {
        "file": "Coastal Haze ON FLOOR WINDOW.png",
        "title": "Coastal Haze",
        "kicker": "Handmade Original",
        "desc": "A handmade piece capturing the dense, atmospheric mist rolling off the coastline."
    },
    {
        "file": "OAPLITE MOCKUP2.png",
        "title": "Oaplite Series",
        "kicker": "Handmade Original",
        "desc": "Abstract and structural, an original piece dealing with organic geometry."
    },
    {
        "file": "oaplite wall.png",
        "title": "Oaplite Wall",
        "kicker": "Handmade Original",
        "desc": "A large-format original exploring texture, scale, and environmental interaction."
    },
    {
        "file": "Poster_Frame_Mockup_2.png",
        "title": "Exhibition Print",
        "kicker": "Handmade Original",
        "desc": "A bold handmade gallery piece, designed to hold court in minimal spaces."
    },
    {
        "file": "Shoreline MOCKED ON DODGEY FLOORS.png",
        "title": "Shoreline",
        "kicker": "Handmade Original",
        "desc": "Original handcrafted print focusing on the shifting tension between water and earth."
    }
]

html_chunks = []
for p in images:
    url_escaped = p['file'].replace(" ", "%20")
    chunk = f"""        <article class="print-card" style="grid-column: span 4;" data-reveal data-tilt>
          <div class="print-card__visual" style="background: url('assets/images/{url_escaped}') center/cover no-repeat; min-height: 280px; border-radius: 22px; border: 1px solid rgba(255, 255, 255, 0.08); margin-bottom: 1rem;"></div>
          <div class="section-head__kicker">{p['kicker']}</div>
          <h2 class="gallery-card__title" style="margin-bottom: 0.5rem; font-size: 1.25rem;">{p['title']}</h2>
          <p class="gallery-card__copy" style="margin-bottom: 1.5rem;">{p['desc']}</p>
          <a class="button button--ghost" href="https://vanvakarnee.com/shop-art-prints/" target="_blank" rel="noreferrer" style="width: 100%; text-align: center; justify-content: center; display: flex;">View in Shop</a>
        </article>"""
    html_chunks.append(chunk)

full_grid_content = "\\n\\n".join(html_chunks)

file_path = r"c:\Users\WATER\Documents\Codex\Portfolio GITHUB\prints.html"
with open(file_path, "r", encoding="utf-8") as f:
    text = f.read()

# We want to replace the contents of `<div class="shell prints-grid">`
# The opening tag is `<div class="shell prints-grid">`
# We can use regex to find everything between that and the closing `</div>` right before `</section>`
pattern = r'(<div class="shell prints-grid">)(.*?)(      </div>\n    </section>)'

if re.search(pattern, text, re.DOTALL):
    new_text = re.sub(pattern, r'\1\n' + full_grid_content + r'\n\3', text, flags=re.DOTALL)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(new_text)
    print("Successfully updated prints.html")
else:
    print("Failed to match the regex for prints.html replacement")
