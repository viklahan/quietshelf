import { AnalysisResponse } from './types';

export function generatePythonCode(data: AnalysisResponse): string {
  // Convert the data to double-escaped JSON so it's perfectly safe inside python triple-quoted string
  const dataString = JSON.stringify(data, null, 2);

  return `#!/usr/bin/env python3
"""
Narrative Corkboard & Story Analyst - Desktop App
Generated dynamically. This applet visualizes character maps, timelines,
sentiment shifts, consistency checks, and dialogue pacing using Python Tkinter.
"""

import tkinter as tk
from tkinter import ttk, messagebox, simpledialog
import json
import math

# Load initial narrative dataset
NARRATIVE_DATA = json.loads('''${dataString.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}''')

class NarrativeApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Narrative Pin-board & Story Analyst")
        self.geometry("1300x850")
        self.configure(bg="#2d2d2d")

        # App Theme & Colors
        self.style = ttk.Style()
        self.style.theme_use("clam")
        
        # Configure dark themes
        self.style.configure(".", background="#2d2d2d", foreground="#ffffff")
        self.style.configure("TNotebook", background="#1e1e1e", borderwidth=0)
        self.style.configure("TNotebook.Tab", background="#333333", foreground="#ffffff", padding=[15, 5])
        self.style.map("TNotebook.Tab", background=[("selected", "#8F5E36"), ("active", "#a06f47")])
        self.style.configure("TFrame", background="#2d2d2d")
        self.style.configure("TLabel", background="#2d2d2d", foreground="#ffffff")
        self.style.configure("TButton", background="#8F5E36", foreground="#ffffff", borderwidth=0, padding=6)
        self.style.map("TButton", background=[("active", "#a06f47")])

        # State Variables
        self.items = {item["id"]: item for item in NARRATIVE_DATA.get("items", [])}
        self.threads = NARRATIVE_DATA.get("threads", [])
        self.timeline = NARRATIVE_DATA.get("timeline", [])
        self.sentiments = NARRATIVE_DATA.get("sentiments", [])
        self.consistency = NARRATIVE_DATA.get("consistency", [])
        self.dialogue = NARRATIVE_DATA.get("dialogue", [])

        # UI Components Dictionary
        self.canvas_widgets = {} # Stores canvas item IDs
        self.drag_data = {"x": 0, "y": 0, "item_id": None}
        self.connecting_source = None
        self.loaded_images = {} # Stores PhotoImage objects for garbage collection preservation

        self.create_widgets()

    def create_widgets(self):
        # Header Area
        header_frame = tk.Frame(self, bg="#1e1e1e", height=70)
        header_frame.pack(fill="x", side="top")
        header_frame.pack_propagate(False)

        title_lbl = tk.Label(header_frame, text=NARRATIVE_DATA.get("title", "STORY STORYBOARD"), 
                             font=("Inter", 16, "bold"), fg="#ffb066", bg="#1e1e1e")
        title_lbl.pack(anchor="w", padx=20, pady=8)

        desc_lbl = tk.Label(header_frame, text=NARRATIVE_DATA.get("description", "Move cards, view development, and tracking emotional shifts."),
                            font=("Inter", 10), fg="#b0b0b0", bg="#1e1e1e")
        desc_lbl.pack(anchor="w", padx=20)

        # Tabbed Layout
        self.notebook = ttk.Notebook(self)
        self.notebook.pack(fill="both", expand=True, padx=10, pady=10)

        # Tab 1: Virtual Corkboard
        self.corkboard_tab = ttk.Frame(self.notebook)
        self.notebook.add(self.corkboard_tab, text=" Virtual Corkboard ")
        self.build_corkboard_ui()

        # Tab 2: Character Development Timeline
        self.timeline_tab = ttk.Frame(self.notebook)
        self.notebook.add(self.timeline_tab, text=" Narrative Timeline ")
        self.build_timeline_ui()

        # Tab 3: Sentiment & Chapter Emotions
        self.sentiment_tab = ttk.Frame(self.notebook)
        self.notebook.add(self.sentiment_tab, text=" Sentiment Tracking ")
        self.build_sentiment_ui()

        # Tab 4: Consistency & Continuity
        self.consistency_tab = ttk.Frame(self.notebook)
        self.notebook.add(self.consistency_tab, text=" Continuity & Profiles ")
        self.build_consistency_ui()

        # Tab 5: Dialogue & Pacing
        self.dialogue_tab = ttk.Frame(self.notebook)
        self.notebook.add(self.dialogue_tab, text=" Dialogue Analyst ")
        self.build_dialogue_ui()

    # --- CORKBOARD CANVAS LOGIC ---
    def build_corkboard_ui(self):
        # Main container with control panel and canvas
        control_pane = tk.Frame(self.corkboard_tab, bg="#232323", width=220)
        control_pane.pack(fill="y", side="left")
        control_pane.pack_propagate(False)

        # Controls Label
        ctrl_title = tk.Label(control_pane, text="CORKBOARD CONTROLS", font=("Inter", 11, "bold"), fg="#ffb066", bg="#232323")
        ctrl_title.pack(pady=15, padx=10, anchor="w")

        # Instruction label
        inst_lbl = tk.Label(control_pane, text="• Drag cards to arrange\\n• Right-click to connect\\n• Double-click to edit\\n• Press 'C' to clear connections",
                            font=("Inter", 9), fg="#b0b0b0", bg="#232323", justify="left")
        inst_lbl.pack(pady=10, padx=10, anchor="w")

        # Action Buttons
        btn_add_char = ttk.Button(control_pane, text="+ Add Character", command=self.add_character_card)
        btn_add_char.pack(fill="x", padx=15, pady=8)

        btn_add_note = ttk.Button(control_pane, text="+ Add Sticky Note", command=self.add_sticky_note)
        btn_add_note.pack(fill="x", padx=15, pady=8)

        btn_add_doc = ttk.Button(control_pane, text="+ Add Clipping", command=self.add_clipping_doc)
        btn_add_doc.pack(fill="x", padx=15, pady=8)

        btn_add_story = ttk.Button(control_pane, text="+ Add Storyboard Panel", command=self.add_storyboard_card)
        btn_add_story.pack(fill="x", padx=15, pady=8)

        # Main Canvas Area for Pinboard
        canvas_container = tk.Frame(self.corkboard_tab, bg="#1e1e1e")
        canvas_container.pack(fill="both", expand=True, side="right")

        # Scrollbars
        h_scroll = tk.Scrollbar(canvas_container, orient="horizontal")
        v_scroll = tk.Scrollbar(canvas_container, orient="vertical")
        
        # Cork Texture-themed Background Color
        self.canvas = tk.Canvas(canvas_container, bg="#c89666", bd=5, relief="ridge",
                                xscrollcommand=h_scroll.set, yscrollcommand=v_scroll.set,
                                scrollregion=(0, 0, 1600, 1000))
        
        h_scroll.config(command=self.canvas.xview)
        v_scroll.config(command=self.canvas.yview)

        h_scroll.pack(side="bottom", fill="x")
        v_scroll.pack(side="right", fill="y")
        self.canvas.pack(fill="both", expand=True, side="left")

        # Draw a beautiful wooden border outline inside canvas
        self.canvas.create_rectangle(10, 10, 1590, 990, outline="#5c3a21", width=12)
        # Subtle texture dots simulating cork board holes
        for xi in range(30, 1600, 40):
            for yi in range(30, 1000, 40):
                offset = (xi + yi) % 7
                self.canvas.create_oval(xi+offset, yi-offset, xi+offset+2, yi-offset+2, fill="#b58355", outline="")

        # Render connections and cards
        self.draw_corkboard_elements()

    def draw_corkboard_elements(self):
        # Clear existing items but preserve background/grid
        for key in list(self.canvas_widgets.keys()):
            self.canvas.delete(key)
        self.canvas_widgets.clear()

        # 1. Draw Thread Lines (Yarn connection cords) first, so they stay behind cards
        self.draw_threads()

        # 2. Draw Cards
        for item_id, item in self.items.items():
            self.create_card_on_canvas(item)

    def draw_threads(self):
        # Remove any existing line drawings
        self.canvas.delete("yarn_thread")
        self.canvas.delete("yarn_label")

        for thread in self.threads:
            src = self.items.get(thread["sourceId"])
            tgt = self.items.get(thread["targetId"])
            if src and tgt:
                # Find approximate center of cards
                x1, y1 = src["x"] + 100, src["y"] + 60
                x2, y2 = tgt["x"] + 100, tgt["y"] + 60
                color = thread.get("color", "#D32F2F")

                # Create slight sag/curve in yarn line
                cx = (x1 + x2) / 2
                cy = (y1 + y2) / 2 + 20 # slight curve down
                
                # Draw main yarn thread
                line_id = self.canvas.create_line(x1, y1, cx, cy, x2, y2, 
                                                 fill=color, width=3, smooth=True, tags=("yarn_thread",))
                
                # Draw small connection text label in middle
                lbl_id = self.canvas.create_text(cx, cy - 10, text=thread["label"], 
                                                 fill="#ffffff", font=("Helvetica", 8, "bold"),
                                                 tags=("yarn_label",))
                # Add background for text
                bbox = self.canvas.bbox(lbl_id)
                if bbox:
                    bg_rect = self.canvas.create_rectangle(bbox[0]-4, bbox[1]-2, bbox[2]+4, bbox[3]+2,
                                                          fill="#111111", outline=color, width=1, tags=("yarn_label",))
                    self.canvas.tag_lower(bg_rect, lbl_id)

    def create_card_on_canvas(self, item):
        id_val = item["id"]
        x, y = item["x"], item["y"]
        w, h = 200, 120
        has_image = False

        # Colors based on type
        if item["type"] == "character":
            bg_color = "#2c2c2c"
            border_color = item.get("color", "#8F5E36")
            text_color = "#ffffff"
            title_font = ("Helvetica", 10, "bold")
        elif item["type"] == "note":
            bg_color = "#fffae0" # post-it yellow
            border_color = "#e5d050"
            text_color = "#111111"
            title_font = ("Helvetica", 9, "bold")
        elif item["type"] == "storyboard":
            bg_color = "#e0f2fe" # light blue storyboard panel
            border_color = "#0284c7"
            text_color = "#0f172a"
            title_font = ("Helvetica", 10, "bold")
            if item.get("image_path"):
                h = 240
                has_image = True
                # Try loading the image
                try:
                    img_path = item["image_path"]
                    if img_path.startswith("data:image/"):
                        import base64
                        import tempfile
                        try:
                            header, encoded = img_path.split(",", 1)
                            ext = ".png" if "png" in header else ".gif"
                            temp_f = tempfile.NamedTemporaryFile(delete=False, suffix=ext)
                            temp_f.write(base64.b64decode(encoded))
                            temp_f.close()
                            img_path = temp_f.name
                        except Exception as decode_err:
                            print("Error decoding base64 image:", decode_err)

                    img = tk.PhotoImage(file=img_path)
                    # Simple native subsampling if image is too large
                    img_w = img.width()
                    img_h = img.height()
                    sub_x = 1
                    sub_y = 1
                    if img_w > 180:
                        sub_x = int(img_w / 180) + 1
                    if img_h > 100:
                        sub_y = int(img_h / 100) + 1
                    
                    sub_factor = max(sub_x, sub_y)
                    if sub_factor > 1:
                        img = img.subsample(sub_factor, sub_factor)
                    
                    self.loaded_images[id_val] = img
                except Exception as e:
                    print("Error loading image:", e)
                    has_image = False
                    h = 120
        else: # document / clipping
            bg_color = "#f5f5f5" # aged paper white
            border_color = "#b0b0b0"
            text_color = "#222222"
            title_font = ("Courier New", 10, "bold")

        # Draw card container
        card_bg = self.canvas.create_rectangle(x, y, x + w, y + h, fill=bg_color, 
                                               outline=border_color, width=3, tags=(id_val, "card"))
        
        # Draw pushpin at top-center of card
        pin_x = x + w / 2
        pin_y = y + 5
        pin_head = self.canvas.create_oval(pin_x - 7, pin_y - 12, pin_x + 7, pin_y + 2, 
                                           fill="#e53935", outline="#b71c1c", width=1, tags=(id_val, "pin"))
        pin_point = self.canvas.create_line(pin_x, pin_y + 2, pin_x, pin_y + 10, 
                                            fill="#757575", width=2, tags=(id_val, "pin"))

        # Render text contents inside card
        txt_title = self.canvas.create_text(x + 10, y + 20, anchor="nw", text=item["title"],
                                            font=title_font, fill=text_color, width=180, tags=(id_val, "text"))
        
        visual_elements = [card_bg, txt_title]

        sub_text = item.get("subtitle", "")
        body_y_offset = 38
        if sub_text:
            txt_sub = self.canvas.create_text(x + 10, y + 36, anchor="nw", text=sub_text,
                                              font=("Helvetica", 8, "italic"), fill="#90a4ae" if item["type"]=="character" else "#555555",
                                              width=180, tags=(id_val, "text"))
            visual_elements.append(txt_sub)
            body_y_offset = 52

        # Card main body text (limited preview)
        desc = item["content"]
        max_len = 160 if has_image else 85
        if len(desc) > max_len:
            desc = desc[:max_len - 3] + "..."
        txt_body = self.canvas.create_text(x + 10, y + body_y_offset, anchor="nw", text=desc,
                                           font=("Helvetica", 8), fill="#cfd8dc" if item["type"]=="character" else "#444444",
                                           width=180, tags=(id_val, "text"))
        visual_elements.append(txt_body)

        # Draw the image if available
        if has_image and id_val in self.loaded_images:
            img_element = self.canvas.create_image(x + w / 2, y + 175, image=self.loaded_images[id_val], anchor="center", tags=(id_val, "image"))
            visual_elements.append(img_element)

        # Bind event listeners for card element dragging and clicking
        for element in visual_elements:
            self.canvas.tag_bind(element, "<Button-1>", lambda event, i=id_val: self.on_card_press(event, i))
            self.canvas.tag_bind(element, "<B1-Motion>", self.on_card_drag)
            self.canvas.tag_bind(element, "<ButtonRelease-1>", self.on_card_release)
            self.canvas.tag_bind(element, "<Double-Button-1>", lambda event, i=id_val: self.edit_card_contents(i))
            self.canvas.tag_bind(element, "<Button-2>", lambda event, i=id_val: self.on_card_right_click(event, i)) # macOS
            self.canvas.tag_bind(element, "<Button-3>", lambda event, i=id_val: self.on_card_right_click(event, i)) # Windows/Linux

    def on_card_press(self, event, item_id):
        self.drag_data["item_id"] = item_id
        # Convert absolute canvas coordinates
        self.drag_data["x"] = self.canvas.canvasx(event.x)
        self.drag_data["y"] = self.canvas.canvasy(event.y)

    def on_card_drag(self, event):
        item_id = self.drag_data["item_id"]
        if not item_id:
            return

        cur_x = self.canvas.canvasx(event.x)
        cur_y = self.canvas.canvasy(event.y)

        dx = cur_x - self.drag_data["x"]
        dy = cur_y - self.drag_data["y"]

        # Move item state coordinates
        self.items[item_id]["x"] += dx
        self.items[item_id]["y"] += dy

        # Move canvas visual elements
        self.canvas.move(item_id, dx, dy)

        # Update last drag coordinates
        self.drag_data["x"] = cur_x
        self.drag_data["y"] = cur_y

        # Re-render yarn connections live during dragging!
        self.draw_threads()

    def on_card_release(self, event):
        self.drag_data["item_id"] = None
        self.draw_corkboard_elements()

    def on_card_right_click(self, event, item_id):
        if not self.connecting_source:
            self.connecting_source = item_id
            self.canvas.itemconfig(self.canvas.find_withtag(f"{item_id} && card")[0], outline="#EF4444", width=4)
            messagebox.showinfo("Yarn Connector", f"Selected '{self.items[item_id]['title']}' as source.\\nNow right-click another card to tie a colored yarn string!")
        else:
            if self.connecting_source == item_id:
                self.connecting_source = None
                self.draw_corkboard_elements()
                return
            
            target_id = item_id
            source_id = self.connecting_source
            self.connecting_source = None

            # Ask user for relationship label
            label = simpledialog.askstring("Yarn Connection", f"Enter relationship description from '{self.items[source_id]['title']}' to '{self.items[target_id]['title']}':")
            if label:
                new_thread = {
                    "id": f"t_custom_{len(self.threads) + 1}",
                    "sourceId": source_id,
                    "targetId": target_id,
                    "label": label,
                    "color": "#EF4444"
                }
                self.threads.append(new_thread)
            self.draw_corkboard_elements()

    def edit_card_contents(self, item_id):
        item = self.items[item_id]
        new_title = simpledialog.askstring("Edit Card Title", "Enter Card Title:", initialvalue=item["title"])
        if new_title is not None:
            new_content = simpledialog.askstring("Edit Card Content", "Enter Card Description:", initialvalue=item["content"])
            if new_content is not None:
                item["title"] = new_title
                item["content"] = new_content
                
                # If storyboard panel, allow image uploading/selection
                if item.get("type") == "storyboard":
                    from tkinter import filedialog
                    upload_img = messagebox.askyesno("Storyboard Image", "Would you like to select/change the image for this storyboard panel?\n(Supports PNG and GIF natively)")
                    if upload_img:
                        file_path = filedialog.askopenfilename(
                            title="Select Storyboard Image (PNG/GIF)",
                            filetypes=[("Image Files", "*.png *.gif"), ("All Files", "*.*")]
                        )
                        if file_path:
                            item["image_path"] = file_path
                            # Clear old cached PhotoImage to force reload
                            if item_id in self.loaded_images:
                                del self.loaded_images[item_id]
                                
                self.draw_corkboard_elements()

    # Create new items
    def add_character_card(self):
        new_id = f"char_{len(self.items) + 1}"
        new_char = {
            "id": new_id,
            "type": "character",
            "title": "New Character",
            "subtitle": "Role Summary",
            "content": "Double-click to edit traits, physical descriptions, and backstory arc.",
            "x": 100,
            "y": 150,
            "color": "#10B981"
        }
        self.items[new_id] = new_char
        self.draw_corkboard_elements()

    def add_sticky_note(self):
        new_id = f"note_{len(self.items) + 1}"
        new_note = {
            "id": new_id,
            "type": "note",
            "title": "Plot Note",
            "content": "Double-click to write down story scenes, events, or key revelations.",
            "x": 150,
            "y": 150,
            "color": "#FEF08A"
        }
        self.items[new_id] = new_note
        self.draw_corkboard_elements()

    def add_clipping_doc(self):
        new_id = f"doc_{len(self.items) + 1}"
        new_doc = {
            "id": new_id,
            "type": "document",
            "title": "Evidence / Paper",
            "content": "A detailed written description of background files, diary entries, or newspaper headlines.",
            "x": 200,
            "y": 150,
            "color": "#F3F4F6"
        }
        self.items[new_id] = new_doc
        self.draw_corkboard_elements()

    def add_storyboard_card(self):
        new_id = f"story_{len(self.items) + 1}"
        new_story = {
            "id": new_id,
            "type": "storyboard",
            "title": "Storyboard Scene",
            "content": "Double-click to edit description and load a custom image panel.",
            "x": 250,
            "y": 150,
            "image_path": ""
        }
        self.items[new_id] = new_story
        self.draw_corkboard_elements()

    # --- TIMELINE TAB ---
    def build_timeline_ui(self):
        # Left pane: List of Milestones
        list_frame = tk.Frame(self.timeline_tab, bg="#232323", width=400)
        list_frame.pack(fill="y", side="left", padx=(0, 10))
        list_frame.pack_propagate(False)

        lbl = tk.Label(list_frame, text="NARRATIVE MILESTONES", font=("Inter", 11, "bold"), fg="#ffb066", bg="#232323")
        lbl.pack(pady=10, padx=10, anchor="w")

        self.timeline_listbox = tk.Listbox(list_frame, bg="#1a1a1a", fg="#ffffff", selectbackground="#8F5E36", bd=0, font=("Helvetica", 10))
        self.timeline_listbox.pack(fill="both", expand=True, padx=10, pady=10)
        self.timeline_listbox.bind("<<ListboxSelect>>", self.on_timeline_select)

        # Right pane: Narrative detail view
        self.timeline_detail_frame = tk.Frame(self.timeline_tab, bg="#1e1e1e", relief="groove", bd=2)
        self.timeline_detail_frame.pack(fill="both", expand=True, side="right")

        self.tl_chapter_lbl = tk.Label(self.timeline_detail_frame, text="Select a milestone to view development", font=("Inter", 14, "bold"), fg="#ffb066", bg="#1e1e1e")
        self.tl_chapter_lbl.pack(anchor="w", padx=20, pady=15)

        self.tl_char_lbl = tk.Label(self.timeline_detail_frame, text="", font=("Inter", 11, "italic"), fg="#b0b0b0", bg="#1e1e1e")
        self.tl_char_lbl.pack(anchor="w", padx=20, pady=2)

        self.tl_score_lbl = tk.Label(self.timeline_detail_frame, text="", font=("Inter", 10, "bold"), fg="#ffffff", bg="#1e1e1e")
        self.tl_score_lbl.pack(anchor="w", padx=20, pady=5)

        self.tl_desc_txt = tk.Text(self.timeline_detail_frame, bg="#1e1e1e", fg="#e0e0e0", bd=0, font=("Helvetica", 11), wrap="word")
        self.tl_desc_txt.pack(fill="both", expand=True, padx=20, pady=15)

        # Populate Listbox
        for idx, milestone in enumerate(self.timeline):
            self.timeline_listbox.insert(idx, f"[{milestone.get('chapter', 'Chapter')}] {milestone.get('character', 'Character')}")

    def on_timeline_select(self, event):
        selection = self.timeline_listbox.curselection()
        if not selection:
            return
        idx = selection[0]
        milestone = self.timeline[idx]

        self.tl_chapter_lbl.config(text=milestone.get("chapter", "Chapter"))
        self.tl_char_lbl.config(text=f"Character Focus: {milestone.get('character', 'N/A')} ({milestone.get('emotionalState', 'N/A')})")
        
        dev_type = milestone.get("developmentType", "stable").upper()
        score = milestone.get("sentimentScore", 0.0)
        self.tl_score_lbl.config(text=f"Development: {dev_type}   |   Sentiment Value: {score:+.2f}")

        self.tl_desc_txt.delete("1.0", tk.END)
        self.tl_desc_txt.insert(tk.END, milestone.get("description", "No description available."))

    # --- SENTIMENT TAB ---
    def build_sentiment_ui(self):
        # Left pane: Graph drawing on canvas!
        graph_container = tk.Frame(self.sentiment_tab, bg="#1e1e1e", relief="sunken", bd=2)
        graph_container.pack(fill="both", expand=True, side="left", padx=(0, 10))

        lbl = tk.Label(graph_container, text="CHAPTER EMOTIONAL SENTIMENT FLUCTUATIONS", font=("Inter", 11, "bold"), fg="#ffb066", bg="#1e1e1e")
        lbl.pack(pady=10, padx=15, anchor="w")

        self.sentiment_canvas = tk.Canvas(graph_container, bg="#1a1a1a", bd=0, highlightthickness=0)
        self.sentiment_canvas.pack(fill="both", expand=True, padx=15, pady=15)
        self.sentiment_canvas.bind("<Configure>", lambda e: self.draw_sentiment_graph())

        # Right pane: Details of sentiments
        self.sent_details_frame = tk.Frame(self.sentiment_tab, bg="#232323", width=350)
        self.sent_details_frame.pack(fill="y", side="right")
        self.sent_details_frame.pack_propagate(False)

        lbl2 = tk.Label(self.sent_details_frame, text="CHAPTER SYNOPSIS", font=("Inter", 11, "bold"), fg="#ffb066", bg="#232323")
        lbl2.pack(pady=15, padx=15, anchor="w")

        self.sent_chapter_lbl = tk.Label(self.sent_details_frame, text="Click graph nodes to analyze", font=("Inter", 12, "bold"), fg="#ffffff", bg="#232323", wraplength=320, justify="left")
        self.sent_chapter_lbl.pack(pady=5, padx=15, anchor="w")

        self.sent_emotion_lbl = tk.Label(self.sent_details_frame, text="", font=("Inter", 10, "italic"), fg="#8F5E36", bg="#232323")
        self.sent_emotion_lbl.pack(pady=2, padx=15, anchor="w")

        self.sent_summary_lbl = tk.Label(self.sent_details_frame, text="", font=("Helvetica", 10), fg="#cfd8dc", bg="#232323", wraplength=320, justify="left")
        self.sent_summary_lbl.pack(pady=10, padx=15, anchor="w")

    def draw_sentiment_graph(self):
        canvas = self.sentiment_canvas
        canvas.delete("all")

        w = canvas.winfo_width()
        h = canvas.winfo_height()
        if w < 100 or h < 100:
            return

        # Padding margins
        pad_x, pad_y = 60, 40
        graph_w = w - pad_x * 2
        graph_h = h - pad_y * 2

        # Draw central baseline (0.0 Sentiment)
        zero_y = pad_y + graph_h / 2
        canvas.create_line(pad_x, zero_y, pad_x + graph_w, zero_y, fill="#444444", width=2, dash=(4, 4))
        canvas.create_text(pad_x - 15, zero_y, text="0.0", fill="#888888", font=("Helvetica", 8))

        # Y-Axis markers (Positive +1.0, Negative -1.0)
        canvas.create_text(pad_x - 15, pad_y, text="+1.0", fill="#4caf50", font=("Helvetica", 8))
        canvas.create_text(pad_x - 15, pad_y + graph_h, text="-1.0", fill="#f44336", font=("Helvetica", 8))

        # Plot data coordinates
        if not self.sentiments:
            return

        points = []
        step_x = graph_w / (len(self.sentiments) - 1) if len(self.sentiments) > 1 else graph_w

        for idx, item in enumerate(self.sentiments):
            score = item.get("score", 0.0) # -1.0 to 1.0
            x = pad_x + idx * step_x
            # invert score: y goes down in canvas
            y = zero_y - (score * (graph_h / 2))
            points.append((x, y, item))

        # Draw connect line curves
        for i in range(len(points) - 1):
            x1, y1, _ = points[i]
            x2, y2, _ = points[i+1]
            canvas.create_line(x1, y1, x2, y2, fill="#8F5E36", width=4, smooth=True)

        # Draw point nodes
        for idx, (x, y, item) in enumerate(points):
            color = "#4caf50" if item.get("score", 0.0) > 0 else "#f44336"
            node = canvas.create_oval(x-6, y-6, x+6, y+6, fill=color, outline="#ffffff", width=2)
            
            # Label Chapter name below point node
            canvas.create_text(x, pad_y + graph_h + 15, text=f"Ch {idx+1}", fill="#ffffff", font=("Helvetica", 8))

            # Bind event click handlers
            canvas.tag_bind(node, "<Button-1>", lambda event, it=item: self.show_sentiment_details(it))

    def show_sentiment_details(self, item):
        self.sent_chapter_lbl.config(text=item.get("chapterName", "Chapter Detail"))
        self.sent_emotion_lbl.config(text=f"Dominant Emotion: {item.get('dominantEmotion', 'Neutral')} (Score: {item.get('score', 0.0):+.2f})")
        self.sent_summary_lbl.config(text=item.get("summary", "No summary captured for this emotional peak."))

    # --- CONSISTENCY TAB ---
    def build_consistency_ui(self):
        # Left pane: List of Profiles
        left_p = tk.Frame(self.consistency_tab, bg="#232323", width=350)
        left_p.pack(fill="y", side="left", padx=(0, 10))
        left_p.pack_propagate(False)

        lbl = tk.Label(left_p, text="CHARACTER CONTINUITY PROFILES", font=("Inter", 11, "bold"), fg="#ffb066", bg="#232323")
        lbl.pack(pady=10, padx=10, anchor="w")

        self.con_listbox = tk.Listbox(left_p, bg="#1a1a1a", fg="#ffffff", selectbackground="#8F5E36", bd=0, font=("Helvetica", 10))
        self.con_listbox.pack(fill="both", expand=True, padx=10, pady=10)
        self.con_listbox.bind("<<ListboxSelect>>", self.on_consistency_select)

        # Right pane: Consistency detail and warnings
        self.con_detail_frame = tk.Frame(self.consistency_tab, bg="#1e1e1e", relief="groove", bd=2)
        self.con_detail_frame.pack(fill="both", expand=True, side="right")

        self.con_title_lbl = tk.Label(self.con_detail_frame, text="Select character to audit continuity", font=("Inter", 14, "bold"), fg="#ffb066", bg="#1e1e1e")
        self.con_title_lbl.pack(anchor="w", padx=20, pady=15)

        self.con_score_lbl = tk.Label(self.con_detail_frame, text="", font=("Inter", 11, "bold"), fg="#ffffff", bg="#1e1e1e")
        self.con_score_lbl.pack(anchor="w", padx=20, pady=5)

        self.con_text = tk.Text(self.con_detail_frame, bg="#1e1e1e", fg="#e0e0e0", bd=0, font=("Helvetica", 10), wrap="word")
        self.con_text.pack(fill="both", expand=True, padx=20, pady=15)

        # Populate Listbox
        for idx, prof in enumerate(self.consistency):
            self.con_listbox.insert(idx, prof.get("characterName", "N/A"))

    def on_consistency_select(self, event):
        selection = self.con_listbox.curselection()
        if not selection:
            return
        idx = selection[0]
        profile = self.consistency[idx]

        self.con_title_lbl.config(text=f"Consistency Audit: {profile.get('characterName')}")
        score = profile.get("overallScore", 100)
        color = "#4caf50" if score >= 90 else "#ff9800" if score >= 75 else "#f44336"
        self.con_score_lbl.config(text=f"Continuity Score: {score}/100", fg=color)

        self.con_text.delete("1.0", tk.END)
        self.con_text.insert(tk.END, "ESTABLISHED FACTS LOGGED IN MANUSCRIPT:\\n" + "="*45 + "\\n\\n")
        
        for fact_item in profile.get("facts", []):
            is_c = "✓" if fact_item.get("isConsistent", True) else "✗ WARNING"
            self.con_text.insert(tk.END, f"• [{is_c}] Fact: {fact_item.get('fact')}\\n")
            self.con_text.insert(tk.END, f"  Established in: {fact_item.get('establishedIn')}\\n")
            if fact_item.get("warningMessage"):
                self.con_text.insert(tk.END, f"  CONFLICT DETAILS: {fact_item.get('warningMessage')}\\n", "warning_color")
            self.con_text.insert(tk.END, "\\n")

        self.con_text.tag_config("warning_color", foreground="#f44336")

    # --- DIALOGUE TAB ---
    def build_dialogue_ui(self):
        # Left pane: List of Speakers
        left_p = tk.Frame(self.dialogue_tab, bg="#232323", width=350)
        left_p.pack(fill="y", side="left", padx=(0, 10))
        left_p.pack_propagate(False)

        lbl = tk.Label(left_p, text="CHARACTER SPEAKING STYLES", font=("Inter", 11, "bold"), fg="#ffb066", bg="#232323")
        lbl.pack(pady=10, padx=10, anchor="w")

        self.diag_listbox = tk.Listbox(left_p, bg="#1a1a1a", fg="#ffffff", selectbackground="#8F5E36", bd=0, font=("Helvetica", 10))
        self.diag_listbox.pack(fill="both", expand=True, padx=10, pady=10)
        self.diag_listbox.bind("<<ListboxSelect>>", self.on_dialogue_select)

        # Right pane: Detailed Analysis
        self.diag_detail_frame = tk.Frame(self.dialogue_tab, bg="#1e1e1e", relief="groove", bd=2)
        self.diag_detail_frame.pack(fill="both", expand=True, side="right")

        self.diag_char_lbl = tk.Label(self.diag_detail_frame, text="Select voice for dialogue pacing analysis", font=("Inter", 14, "bold"), fg="#ffb066", bg="#1e1e1e")
        self.diag_char_lbl.pack(anchor="w", padx=20, pady=15)

        self.diag_stats_lbl = tk.Label(self.diag_detail_frame, text="", font=("Inter", 11, "bold"), fg="#ffffff", bg="#1e1e1e")
        self.diag_stats_lbl.pack(anchor="w", padx=20, pady=5)

        self.diag_text = tk.Text(self.diag_detail_frame, bg="#1e1e1e", fg="#e0e0e0", bd=0, font=("Helvetica", 10), wrap="word")
        self.diag_text.pack(fill="both", expand=True, padx=20, pady=15)

        # Populate listbox
        for idx, dial in enumerate(self.dialogue):
            self.diag_listbox.insert(idx, dial.get("characterName", "N/A"))

    def on_dialogue_select(self, event):
        selection = self.diag_listbox.curselection()
        if not selection:
            return
        idx = selection[0]
        review = self.dialogue[idx]

        self.diag_char_lbl.config(text=f"Dialogue Review: {review.get('characterName')}")
        self.diag_stats_lbl.config(text=f"Naturalness Rank: {review.get('naturalnessScore')}/100   |   Pacing Integrity: {review.get('pacingScore')}/100")

        self.diag_text.delete("1.0", tk.END)
        self.diag_text.insert(tk.END, f"EXECUTIVE PACING & DIALOGUE FEEDBACK:\\n{review.get('feedback', '')}\\n\\n" + "="*45 + "\\n\\n")
        self.diag_text.insert(tk.END, "SUBTEXT AND TRANSCRIPT AUDITS:\\n\\n")

        for ex in review.get("examples", []):
            self.diag_text.insert(tk.END, f"\\"[Dialogue Quote]\\":\\n  {ex.get('quote')}\\n\\n", "quote_tag")
            self.diag_text.insert(tk.END, f"  * Undercurrent Subtext: {ex.get('subtext')}\\n")
            self.diag_text.insert(tk.END, f"  * Writing Recommendation: {ex.get('recommendation')}\\n\\n")

        self.diag_text.tag_config("quote_tag", foreground="#8F5E36", font=("Courier", 10, "italic"))

if __name__ == "__main__":
    app = NarrativeApp()
    app.mainloop()
`;
}
