import 'package:flutter_test/flutter_test.dart';

import 'package:adaptive_ups_flutter/main.dart';

void main() {
  testWidgets('Adaptive UPS app renders dashboard title', (WidgetTester tester) async {
    await tester.pumpWidget(const AdaptiveUpsApp());
    await tester.pumpAndSettle();

    expect(find.text('A-UPS Smart Dashboard'), findsOneWidget);
  });
}
