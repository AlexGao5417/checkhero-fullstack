from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
import requests
from io import BytesIO
from app import constants


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

def generate_gas_pdf(data, filename="generated_gas_report.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=A4,
        rightMargin=20 * mm,
        leftMargin=20 * mm,
        topMargin=20 * mm,
        bottomMargin=20 * mm
    )
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('Title', parent=styles['Heading1'], fontSize=18, textColor=colors.HexColor('#2E4A62'), spaceAfter=12)
    section_style = ParagraphStyle('Section', parent=styles['Heading2'], fontSize=14, textColor=colors.HexColor('#1F618D'), spaceBefore=10, spaceAfter=6)
    normal_style = ParagraphStyle('Normal', parent=styles['BodyText'], fontSize=10, leading=12)
    elements = []

    # Title
    elements.append(Paragraph("Gas Safety Report", title_style))
    elements.append(Paragraph(f"<b>Property Address:</b> {data.get('propertyAddress', '')}", normal_style))
    elements.append(Paragraph(f"<b>Date of Inspection:</b> {data.get('dateOfInspection', '')}", normal_style))
    elements.append(Paragraph(f"<b>Agent Name:</b> {data.get('agentName', '')}", normal_style))
    inspector = data.get('inspectorDetails', {})
    elements.append(Paragraph(f"<b>Inspector Name:</b> {inspector.get('inspectorName', '')}", normal_style))
    elements.append(Spacer(1, 8))

    # Checks Conducted
    elements.append(Paragraph("Checks Conducted", section_style))
    checks = data.get('checksConducted', {})
    for k, v in checks.items():
        elements.append(Paragraph(f"<b>{k}:</b> {v}", normal_style))
    elements.append(Spacer(1, 8))

    # Faults/Remedial Actions
    elements.append(Paragraph("Faults/Remedial Actions", section_style))
    faults = data.get('faultsRemedialActions', [])
    if faults:
        table_data = [["Observation", "Recommendation", "Image"]]
        for f in faults:
            table_data.append([
                f.get('observation', ''),
                f.get('recommendation', ''),
                f.get('image', '')
            ])
        tbl = Table(table_data, colWidths=[40*mm, 60*mm, 50*mm])
        tbl.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F618D')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (1, 1), (-1, -1), 'CENTER'),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.whitesmoke, colors.lightgrey]),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        elements.append(tbl)
        elements.append(Spacer(1, 8))

    # Gas Safety Report Details
    elements.append(Paragraph("Gas Safety Report Details", section_style))
    details = data.get('gasSafetyReportDetails', {})
    for k, v in details.items():
        elements.append(Paragraph(f"<b>{k}:</b> {v}", normal_style))
    elements.append(Spacer(1, 8))

    # Gas Installation
    elements.append(Paragraph("Gas Installation", section_style))
    install = data.get('gasInstallation', {})
    for k, v in install.items():
        elements.append(Paragraph(f"<b>{k}:</b> {v}", normal_style))
    elements.append(Spacer(1, 8))

    # Gas Appliances
    elements.append(Paragraph("Gas Appliances", section_style))
    appliances = data.get('gasAppliances', [])
    if appliances:
        table_data = [["Name", "Image", "Isolation Valve", "Electrically Safe", "Ventilation", "Clearances", "AS4575", "Comments"]]
        for a in appliances:
            table_data.append([
                a.get('applianceName', ''),
                a.get('applianceImage', ''),
                a.get('isolationValvePresent', ''),
                a.get('electricallySafe', ''),
                a.get('adequateVentilation', ''),
                a.get('adequateClearances', ''),
                a.get('serviceInAccordanceWithAS4575', ''),
                a.get('comments', '')
            ])
        tbl = Table(table_data, colWidths=[30*mm, 30*mm, 20*mm, 20*mm, 20*mm, 20*mm, 20*mm, 30*mm])
        tbl.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F618D')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (1, 1), (-1, -1), 'CENTER'),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.whitesmoke, colors.lightgrey]),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        elements.append(tbl)
        elements.append(Spacer(1, 8))

    # Appliance Servicing Compliance
    elements.append(Paragraph("Appliance Servicing Compliance", section_style))
    compliance = data.get('applianceServicingCompliance', {})
    for k, v in compliance.items():
        elements.append(Paragraph(f"<b>{k}:</b> {v}", normal_style))
    elements.append(Spacer(1, 8))

    # Declaration
    elements.append(Paragraph("Declaration", section_style))
    declaration = data.get('declaration', {})
    for k, v in declaration.items():
        elements.append(Paragraph(f"<b>{k}:</b> {v}", normal_style))
    elements.append(Spacer(1, 8))

    # Annex Photos
    elements.append(Paragraph("Annex Photos", section_style))
    annex = data.get('annexPhotos', [])
    if annex:
        table_data = [["Appliance Name", "Photo URL"]]
        for a in annex:
            table_data.append([
                a.get('applianceName', ''),
                a.get('photoUrl', '')
            ])
        tbl = Table(table_data, colWidths=[60*mm, 100*mm])
        tbl.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F618D')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (1, 1), (-1, -1), 'CENTER'),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.whitesmoke, colors.lightgrey]),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        elements.append(tbl)
    doc.build(elements)


def generate_smoke_pdf(data, filename="generated_smoke_report.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=A4,
        rightMargin=20 * mm,
        leftMargin=20 * mm,
        topMargin=20 * mm,
        bottomMargin=20 * mm
    )
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('Title', parent=styles['Heading1'], fontSize=18, textColor=colors.HexColor('#2E4A62'), spaceAfter=12)
    section_style = ParagraphStyle('Section', parent=styles['Heading2'], fontSize=14, textColor=colors.HexColor('#1F618D'), spaceBefore=10, spaceAfter=6)
    normal_style = ParagraphStyle('Normal', parent=styles['BodyText'], fontSize=10, leading=12)
    elements = []

    # Title
    elements.append(Paragraph("Smoke Alarm Report", title_style))
    elements.append(Paragraph(f"<b>Property Address:</b> {data.get('propertyAddress', '')}", normal_style))
    elements.append(Paragraph(f"<b>Date of Inspection:</b> {data.get('dateOfInspection', '')}", normal_style))
    elements.append(Paragraph(f"<b>Agent Name:</b> {data.get('agentName', '')}", normal_style))
    inspector = data.get('inspectorDetails', {})
    elements.append(Paragraph(f"<b>Inspector Name:</b> {inspector.get('inspectorName', '')}", normal_style))
    elements.append(Spacer(1, 8))

    # Smoke Alarm Details
    elements.append(Paragraph("Smoke Alarm Details", section_style))
    alarms = data.get('smokeAlarmDetails', [])
    if alarms:
        table_data = [["Voltage", "Status", "Location", "Expiration"]]
        for a in alarms:
            table_data.append([
                a.get('voltage', ''),
                a.get('status', ''),
                a.get('location', ''),
                a.get('expiration', '')
            ])
        tbl = Table(table_data, colWidths=[30*mm, 30*mm, 60*mm, 40*mm])
        tbl.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F618D')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (1, 1), (-1, -1), 'CENTER'),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.whitesmoke, colors.lightgrey]),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        elements.append(tbl)
        elements.append(Spacer(1, 8))

    # Image Appendix
    elements.append(Paragraph("Image Appendix", section_style))
    appendix = data.get('imageAppendix', [])
    if appendix:
        table_data = [["Image", "Description"]]
        for a in appendix:
            table_data.append([
                a.get('image', ''),
                a.get('description', '')
            ])
        tbl = Table(table_data, colWidths=[60*mm, 100*mm])
        tbl.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F618D')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (1, 1), (-1, -1), 'CENTER'),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.whitesmoke, colors.lightgrey]),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        elements.append(tbl)
    doc.build(elements)


def generate_pdf_dispatcher(data, report_type, filename):
    if report_type == constants.ELECTRICITY_AND_SMOKE_REPORT_TYPE:
        return generate_report(data, filename)
    elif report_type == constants.GAS_REPORT_TYPE:
        return generate_gas_pdf(data, filename)
    elif report_type == constants.SMOKE_REPORT_TYPE:
        return generate_smoke_pdf(data, filename)
    else:
        raise ValueError(f"Unknown report type: {report_type}")
