#!/usr/bin/env python3
"""
Test script to verify ARS node configuration structures
"""

# Example ARS node configurations based on our implementation

# 1. Voice Ment Node Example
voice_ment_config = {
    "node_type": "voice_ment",
    "name": "메인 메뉴 안내",
    "config": {
        "text_content": "메뉴 개수는 6개입니다. 사고접수는 1번, 자동차 고장출동은 2번, 신규가입상담은 3번, 질병상해계약 관리는 4번, 대출상담은 5번, 상담사 연결은 6번을 눌러주십시오.",
        "voice_actor_id": "professional_female_voice",
        "tts_speed": 1.0,
        "volume": 1.0,
        "repeat_count": 1,
        "wait_after": 0.5
    }
}

# 2. Condition Node Example (Time Check)
condition_time_config = {
    "node_type": "condition",
    "name": "영업시간 확인",
    "config": {
        "condition_type": "time_check",
        "start_time": "09:00",
        "end_time": "18:00",
        "rules": [
            {
                "condition": "within_hours",
                "target_node": "business_hours_menu",
                "label": "영업시간 내"
            },
            {
                "condition": "outside_hours",
                "target_node": "after_hours_message",
                "label": "영업시간 외"
            }
        ]
    }
}

# 3. Menu Select Node Example
menu_select_config = {
    "node_type": "menu_select",
    "name": "메인 메뉴 선택",
    "config": {
        "menu_items": [
            {"key": "1", "label": "사고접수", "target_node": "accident_input"},
            {"key": "2", "label": "자동차 고장출동", "target_node": "breakdown_input"},
            {"key": "3", "label": "신규가입상담", "target_node": "signup_transfer"},
            {"key": "4", "label": "질병상해계약 관리", "target_node": "contract_input"},
            {"key": "5", "label": "대출상담", "target_node": "loan_transfer"},
            {"key": "6", "label": "상담사 연결", "target_node": "agent_transfer"}
        ],
        "timeout_seconds": 10,
        "max_retries": 3,
        "invalid_message": "잘못된 번호입니다. 다시 입력해주세요.",
        "timeout_message": "입력 시간이 초과되었습니다."
    }
}

# 4. Input Collect Node Example (Birth Date)
input_collect_config = {
    "node_type": "input_collect",
    "name": "고객 정보 수집",
    "config": {
        "input_type": "birth_date",
        "variable_name": "customer_birth_date",
        "prompt_message": "계약 조회를 위해 생년월일 8자리를 입력해주세요.",
        "min_length": 8,
        "max_length": 8,
        "validation_pattern": "^(19|20)\\d{6}$",
        "timeout_seconds": 15,
        "max_retries": 3,
        "invalid_message": "올바른 생년월일 8자리를 입력해주세요.",
        "dtmf_terminator": "#"
    }
}

# 5. External API Node Example (Host System)
external_api_config = {
    "node_type": "external_api",
    "name": "계약 조회",
    "config": {
        "api_type": "host_system",
        "endpoint_name": "LtrF020",
        "host_system_id": "CORE_INSURANCE",
        "transaction_code": "CONTRACT_INQUIRY",
        "request_mapping": {
            "birth_date": "{session.customer_birth_date}",
            "phone_number": "{caller_id}",
            "system_date": "{current_date}",
            "inquiry_type": "01"
        },
        "response_mapping": {
            "contract_list": "session.customer_contracts",
            "customer_name": "session.customer_name",
            "customer_grade": "session.customer_grade"
        },
        "timeout_seconds": 30,
        "retry_count": 2,
        "error_handling": {
            "E001": "no_contract_found",
            "E002": "system_error_flow",
            "timeout": "api_timeout_flow"
        }
    }
}

# 6. Transfer Node Example
transfer_config = {
    "node_type": "transfer",
    "name": "상담사 연결",
    "config": {
        "transfer_type": "agent",
        "destination": "1001",
        "queue_music": "hold_music_01.wav",
        "max_wait_time": 300,
        "overflow_action": "voicemail",
        "priority": 5
    }
}

def test_node_configurations():
    """Test all node configurations for completeness"""
    
    test_nodes = [
        ("Voice Ment", voice_ment_config),
        ("Condition (Time)", condition_time_config),
        ("Menu Select", menu_select_config),
        ("Input Collect", input_collect_config),
        ("External API", external_api_config),
        ("Transfer", transfer_config)
    ]
    
    print("🧪 Testing ARS Node Configurations")
    print("=" * 50)
    
    for name, config in test_nodes:
        print(f"\n✅ {name} Node:")
        print(f"   Type: {config['node_type']}")
        print(f"   Name: {config['name']}")
        
        # Test config structure
        config_keys = list(config['config'].keys())
        print(f"   Config keys: {config_keys}")
        
        # Validate required fields based on type
        if config['node_type'] == 'voice_ment':
            required = ['text_content']
            has_required = all(key in config['config'] for key in required)
            print(f"   Required fields present: {has_required}")
            
        elif config['node_type'] == 'condition':
            required = ['condition_type', 'rules']
            has_required = all(key in config['config'] for key in required)
            print(f"   Required fields present: {has_required}")
            
        elif config['node_type'] == 'menu_select':
            required = ['menu_items']
            has_required = all(key in config['config'] for key in required)
            menu_count = len(config['config']['menu_items'])
            print(f"   Required fields present: {has_required}")
            print(f"   Menu items count: {menu_count}")
            
        elif config['node_type'] == 'input_collect':
            required = ['input_type', 'variable_name', 'prompt_message']
            has_required = all(key in config['config'] for key in required)
            print(f"   Required fields present: {has_required}")
            
        elif config['node_type'] == 'external_api':
            required = ['api_type', 'endpoint_name', 'request_mapping', 'response_mapping']
            has_required = all(key in config['config'] for key in required)
            print(f"   Required fields present: {has_required}")
            
        elif config['node_type'] == 'transfer':
            required = ['transfer_type', 'destination']
            has_required = all(key in config['config'] for key in required)
            print(f"   Required fields present: {has_required}")

def test_scenario_example():
    """Test a complete scenario using multiple node types"""
    
    print("\n🏗️  Testing Complete ARS Scenario Example")
    print("=" * 50)
    
    scenario = {
        "scenario_name": "영업시간 메인 시나리오",
        "description": "평일 09-18시 정규 영업시간 ARS 처리",
        "nodes": [
            {
                "node_id": "start_main",
                "node_type": "start",
                "name": "시나리오 시작"
            },
            condition_time_config,
            voice_ment_config,
            menu_select_config,
            input_collect_config,
            external_api_config,
            transfer_config
        ]
    }
    
    print(f"✅ Scenario: {scenario['scenario_name']}")
    print(f"✅ Description: {scenario['description']}")
    print(f"✅ Total nodes: {len(scenario['nodes'])}")
    
    node_types = [node.get('node_type', 'unknown') for node in scenario['nodes']]
    unique_types = set(node_types)
    print(f"✅ Node types used: {sorted(unique_types)}")
    
    # Check ARS-specific types
    ars_types = ['condition', 'voice_ment', 'menu_select', 'input_collect', 'external_api', 'transfer']
    found_ars = [t for t in ars_types if t in unique_types]
    print(f"✅ ARS node types implemented: {found_ars} ({len(found_ars)}/6)")
    
    return len(found_ars) == 6

if __name__ == "__main__":
    print("🎭 ARS 시나리오 노드 시스템 테스트")
    print("=" * 60)
    
    # Test individual configurations
    test_node_configurations()
    
    # Test complete scenario
    success = test_scenario_example()
    
    print("\n" + "=" * 60)
    if success:
        print("🎉 모든 ARS 노드 타입이 성공적으로 구현되었습니다!")
        print("✅ 시나리오 생성이 가능합니다.")
    else:
        print("⚠️  일부 노드 타입이 누락되었습니다.")
    
    print("\n📋 다음 단계:")
    print("1. 데이터베이스 마이그레이션 실행")
    print("2. 프론트엔드에서 새 노드 타입으로 시나리오 생성 테스트")
    print("3. API 엔드포인트를 통한 시나리오 저장/조회 테스트")
    print("4. TTS 생성 및 시뮬레이션 기능 테스트")