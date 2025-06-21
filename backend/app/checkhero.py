from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
import requests
from io import BytesIO


# Function to generate the PDF report

def generate_report(data, filename="generated_report.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=A4,
        rightMargin=20 * mm,
        leftMargin=20 * mm,
        topMargin=20 * mm,
        bottomMargin=20 * mm
    )
    styles = getSampleStyleSheet()

    # Custom paragraph styles
    title_style = ParagraphStyle(
        'Title',
        parent=styles['Heading1'],
        fontSize=18,
        textColor=colors.HexColor('#2E4A62'),
        spaceAfter=12
    )
    section_style = ParagraphStyle(
        'Section',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#1F618D'),
        spaceBefore=10,
        spaceAfter=6
    )
    normal_style = ParagraphStyle(
        'Normal',
        parent=styles['BodyText'],
        fontSize=10,
        leading=12
    )

    # Initialize flowable container
    elements = []

    # Helper to display pass/fail
    def pass_fail(val):
        return "Pass" if val else "Fail"

    # Helper to build styled boolean tables
    def add_boolean_table(title, items, strip_key=None):
        elements.append(Paragraph(title, section_style))
        table_data = [["Item", "Yes/No"]]
        for key, val in items.items():
            label = key.replace(strip_key, '').strip() if strip_key else key
            table_data.append([label, "Yes" if val else "No"])
        tbl = Table(table_data, colWidths=[120 * mm, 30 * mm])
        tbl.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F618D')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (1, 1), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.whitesmoke, colors.lightgrey]),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(tbl)
        elements.append(Spacer(1, 12))

    # Title and header
    elements.append(Paragraph("Electrical & Smoke Safety Report", title_style))
    elements.append(Paragraph(f"<b>Property Address:</b> {data.get('propertyAddress', '')}", normal_style))
    elements.append(Paragraph(f"<b>Report Date:</b> {data.get('reportDate', '')}", normal_style))
    elements.append(Spacer(1, 8))

    # Safety check summary
    elements.append(Paragraph(f"<b>Electrical Safety Check:</b> {pass_fail(data.get('electricalSafetyCheck', False))}",
                              normal_style))
    elements.append(
        Paragraph(f"<b>Smoke Safety Check:</b> {pass_fail(data.get('smokeSafetyCheck', False))}", normal_style))
    elements.append(Spacer(1, 12))

    # Detailed tables
    add_boolean_table("Extent of Installation & Limitations", data.get('installationExtent', {}))
    add_boolean_table("Visual Inspection Results", data.get('visualInspection', {}), strip_key="Visual - ")
    add_boolean_table("Polarity Testing Results", data.get('polarityTesting', {}), strip_key="Polarity - ")
    add_boolean_table("Earth Continuity Testing Results", data.get('earthContinuityTesting', {}), strip_key="Earth - ")

    # RCD & smoke alarms
    elements.append(
        Paragraph(f"<b>RCD Testing Passed:</b> {'Yes' if data.get('rcdTestingPassed') else 'No'}", normal_style))
    elements.append(
        Paragraph(f"<b>Smoke Alarms Working:</b> {'Yes' if data.get('smokeAlarmsWorking') else 'No'}", normal_style))
    elements.append(
        Paragraph(f"<b>Next Smoke Alarm Check:</b> {data.get('nextSmokeAlarmCheckDate', '')}", normal_style))
    elements.append(Spacer(1, 12))

    # Smoke alarm details
    elements.append(Paragraph("Smoke Alarm Details", section_style))
    alarm_data = [["Voltage", "Status", "Location", "Level", "Expiration"]]
    for alarm in data.get('smokeAlarmDetails', []):
        alarm_data.append([
            alarm.get('voltage', ''),
            alarm.get('status', ''),
            alarm.get('location', ''),
            alarm.get('level', ''),
            alarm.get('expiration', '')
        ])
    alarm_tbl = Table(alarm_data, colWidths=[20 * mm, 30 * mm, 40 * mm, 20 * mm, 30 * mm])
    alarm_tbl.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F618D')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (1, 1), (-1, -1), 'CENTER'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.whitesmoke, colors.lightgrey]),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(alarm_tbl)
    elements.append(Spacer(1, 12))

    # Observations & recommendations
    elements.append(Paragraph(f"<b>Observation:</b> {data.get('observation', '')}", normal_style))
    elements.append(Paragraph(f"<b>Recommendation:</b> {data.get('recommendation', '')}", normal_style))
    elements.append(Spacer(1, 12))

    # Certification block
    elements.append(Paragraph(
        f"Completed by: {data.get('electricalSafetyCheckCompletedBy', '')} (Lic: {data.get('licenceNumber', '')})",
        normal_style))
    elements.append(Paragraph(f"Inspection Date: {data.get('inspectionDate', '')}", normal_style))
    elements.append(Paragraph(f"Next Inspection Due: {data.get('nextInspectionDueDate', '')}", normal_style))
    elements.append(Paragraph(f"Signature Date: {data.get('signatureDate', '')}", normal_style))

    # Add images from S3 URLs
    image_urls = data.get('images', [])
    if image_urls:
        elements.append(Spacer(1, 12))
        elements.append(Paragraph("Attached Images", section_style))
        for url in image_urls:
            try:
                response = requests.get(url, stream=True)
                response.raise_for_status()
                image = Image(ImageReader(BytesIO(response.content)))
                image.drawWidth = 150 * mm
                image.drawHeight = 100 * mm
                image.hAlign = 'CENTER'
                elements.append(image)
                elements.append(Spacer(1, 6))
            except requests.exceptions.RequestException as e:
                print(f"Could not fetch image from {url}: {e}")
                elements.append(Paragraph(f"<i>Could not load image from {url}</i>", normal_style))

    # Build PDF
    doc.build(elements)

# To generate the PDF, call:
dummy_form_data = {
        "propertyAddress": "449 Mount Dandenong Road, Kilsyth VIC 3137",
        "reportDate": "2024-01-24",
        "electricalSafetyCheck": False,
        "smokeSafetyCheck": True,
        "installationExtent": {
            "Main Switchboard": True,
            "Other living areas": True,
            "Main earthing system": False,
            "Laundry": True,
            "Kitchen": True,
            "Garage": False,
            "Bathroom (main)": True,
            "Solar/battery system": False,
            "Other bathrooms/ensuites": True,
            "Installation - Electric water heater": True,
            "Bedroom (main)": True,
            "Installation - Dishwasher": False,
            "Other bedrooms": True,
            "Installation - Electric room/space heaters": True,
            "Living room": True,
            "Installation - Swimming pool equipment": False,
        },
        "visualInspection": {
            "Visual - Consumers mains": True,
            "Visual - Space heaters": True,
            "Visual - Switchboards": True,
            "Visual - Cooking equipment": True,
            "Visual - Exposed earth electrode": False,
            "Visual - Dishwasher": False,
            "Visual - Metallic water pipe bond": True,
            "Visual - Exhaust fans": True,
            "Visual - RCDs (Safety switches)": True,
            "Visual - Celling fans": True,
            "Visual - Circuit protection (circuit breakers/fuses)": True,
            "Visual - Washing machinedryer/": True,
            "Visual - Socket-outlets": True,
            "Visual - Installation wiring": True,
            "Visual - Light fittings": True,
            "Visual - Solar and other renewable systems": False,
            "Visual - Electric water heater": True,
            "Visual - Swimming pool equipment": False,
            "Visual - Air conditioners": True,
            "Visual - Vehicle chargers": False,
        },
        "polarityTesting": {
            "Polarity - Consumers mains": True,
            "Polarity - Electric water heater": True,
            "Polarity - Circuit protection (circuit breakers/fuses)": True,
            "Polarity - Air conditioners": True,
            "Polarity - RCDs (Safety switches)": True,
            "Polarity - Cooking equipment": True,
            "Polarity - Dishwasher": True,
            "Polarity - Circuit protection (circuit breakers/fuses) (D2)": True,
            "Polarity - Solar and other renewable systems": False,
            "Polarity - Socket-outlets": True,
            "Polarity - Swimming pool equipment": False,
            "Polarity - Vehicle chargers": False,
        },
        "earthContinuityTesting": {
            "Earth - Mains earth conductor": True,
            "Earth - Electric water heater": True,
            "Earth - Metallic water pipe bond": True,
            "Earth - Air conditioners": True,
            "Earth - Socket-outlets": True,
            "Earth - Cooking equipment": True,
            "Earth - Light fittings": True,
            "Earth - Dishwasher": True,
            "Earth - Exhaust fans": True,
            "Earth - Solar and other renewable systems": False,
            "Earth - Celling fans": True,
            "Earth - Swimming pool equipment": False,
            "Earth - Vehicle chargers": False,
        },
        "rcdTestingPassed": True,
        "smokeAlarmsWorking": True,
        "nextSmokeAlarmCheckDate": "2025-01-24",
        "smokeAlarmDetails": [
            {"voltage": "9V", "status": "Working", "location": "Hallway", "level": "LVL 1", "expiration": "2030-11-20"},
            {"voltage": "9V", "status": "Working", "location": "Bedroom 1", "level": "LVL 1", "expiration": "2030-11-21"},
        ],
        "observation": "Sub board garage required upgrade.",
        "recommendation": "Replace switchboard enclosure x1 main switch and x2 R.C.B.O x1 10amp x1 20amp.",
        "images": [
            # Example of a base64 encoded image (a very small red dot)
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==",
             "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg=="
        ],
        "electricalSafetyCheckCompletedBy": "John Doe",
        "licenceNumber": "EL123456",
        "inspectionDate": "2024-01-24",
        "nextInspectionDueDate": "2025-01-24",
        "signatureDate": "2024-01-24",
    }
# generate_report(dummy_form_data)
