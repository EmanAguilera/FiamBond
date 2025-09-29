import boto3

# This is the most important line:
# It tells boto3 to connect to your LocalStack container on your machine
# instead of the real AWS on the internet.
s3_client = boto3.client(
    "s3",
    endpoint_url="http://localhost:4566",
    # Dummy credentials are required but not validated by LocalStack
    aws_access_key_id="test",
    aws_secret_access_key="test",
    region_name="us-east-1"
)

bucket_name = "fiambond-local-test-bucket"

try:
    print(f"Attempting to create S3 bucket: {bucket_name}")
    s3_client.create_bucket(Bucket=bucket_name)
    print("✅ Bucket created successfully!")

    print("\nVerifying by listing all buckets...")
    response = s3_client.list_buckets()
    
    print("Buckets found in LocalStack:")
    for bucket in response['Buckets']:
        print(f"  - {bucket['Name']}")

except Exception as e:
    print(f"❌ An error occurred: {e}")