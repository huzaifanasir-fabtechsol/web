from rest_framework import serializers
from .models import HorseOwner, Horse


class HorseOwnerSerializer(serializers.ModelSerializer):
    class Meta:
        model = HorseOwner
        fields = [
            'id', 'name', 'phone', 'email', 'cnic', 'address',
            'joined_date', 'owner_type', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_owner_type(self, value):
        if value == 'Company Owned':
            raise serializers.ValidationError(
                "Manually registering or updating an owner profile with type 'Company Owned' is prohibited."
            )
        return value



class HorseSerializer(serializers.ModelSerializer):
    owner_name = serializers.CharField(source='owner.name', read_only=True)
    owner_email = serializers.CharField(source='owner.email', read_only=True)

    class Meta:
        model = Horse
        fields = [
            'id', 'horse_name', 'owner', 'owner_name', 'owner_email',
            'arrival_date', 'height', 'date_of_birth', 'color', 'breed',
            'gender', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
